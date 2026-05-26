"""Iter 8 — P0 hardening backend tests.

Covers:
- MongoDB indexes verified on users.device_id, accounts.email,
  magic_links.token, magic_links.expires_dt (TTL), payment_transactions.session_id.
- Rate limiting on POST /api/auth/magic-link/request:
    * 4th call from same device_id within 10 min returns 429.
    * 6th call from same email within an hour (different device_ids) returns 429.
- ALLOW_DEV_MAGIC_LINK default (=1) returns dev_link in response (gating logic).
- Regression: /api/users/init, /api/checkout/session (AUD), /api/affiliate/preview.
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


def _did():
    return f"dev-iter8-{uuid.uuid4().hex[:16]}"


def _init(device_id):
    r = requests.post(f"{API}/users/init", json={"device_id": device_id, "platform": "web"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


# -------------------- Indexes --------------------
class TestIndexes:
    """Verify on-startup indexes were created."""

    def _has_index(self, coll, keys, unique=None, ttl=False):
        info = list(coll.list_indexes())
        for idx in info:
            ks = list(idx.get("key", {}).items())
            if ks == keys:
                if unique is not None and bool(idx.get("unique", False)) != unique:
                    continue
                if ttl and "expireAfterSeconds" not in idx:
                    continue
                return True
        return False

    def test_users_device_id_unique(self):
        assert self._has_index(_db.users, [("device_id", 1)], unique=True), \
            f"users indexes: {list(_db.users.list_indexes())}"

    def test_accounts_email_unique(self):
        assert self._has_index(_db.accounts, [("email", 1)], unique=True), \
            f"accounts indexes: {list(_db.accounts.list_indexes())}"

    def test_magic_links_token_unique(self):
        assert self._has_index(_db.magic_links, [("token", 1)], unique=True), \
            f"magic_links indexes: {list(_db.magic_links.list_indexes())}"

    def test_magic_links_expires_dt_ttl(self):
        assert self._has_index(_db.magic_links, [("expires_dt", 1)], ttl=True), \
            f"magic_links indexes: {list(_db.magic_links.list_indexes())}"

    def test_payment_transactions_session_id_unique(self):
        assert self._has_index(_db.payment_transactions, [("session_id", 1)], unique=True), \
            f"payment_transactions indexes: {list(_db.payment_transactions.list_indexes())}"


# -------------------- Rate limiting --------------------
class TestRateLimiting:
    def test_device_rate_limit_after_3_calls(self):
        did = _did()
        _init(did)
        # Use a unique email per call so email rate limit doesn't trip first.
        for i in range(3):
            email = f"TEST_rl_dev_{uuid.uuid4().hex[:8]}@example.test"
            r = requests.post(f"{API}/auth/magic-link/request",
                              json={"device_id": did, "email": email,
                                    "origin_url": "https://example.test"}, timeout=15)
            assert r.status_code == 200, f"call {i+1}: {r.status_code} {r.text}"
        # 4th call should be rate-limited
        email = f"TEST_rl_dev_{uuid.uuid4().hex[:8]}@example.test"
        r = requests.post(f"{API}/auth/magic-link/request",
                          json={"device_id": did, "email": email,
                                "origin_url": "https://example.test"}, timeout=15)
        assert r.status_code == 429, f"expected 429 on 4th, got {r.status_code} {r.text}"
        body = r.json()
        detail = body.get("detail", "")
        assert "Too many sign-in requests" in detail, f"unexpected detail: {detail}"

    def test_email_rate_limit_after_5_calls(self):
        # 5 different devices, same email -> 6th should 429 with email message.
        email = f"TEST_rl_email_{uuid.uuid4().hex[:8]}@example.test"
        for i in range(5):
            did = _did()
            _init(did)
            r = requests.post(f"{API}/auth/magic-link/request",
                              json={"device_id": did, "email": email,
                                    "origin_url": "https://example.test"}, timeout=15)
            assert r.status_code == 200, f"call {i+1}: {r.status_code} {r.text}"
        # 6th call -> should be email rate-limited
        did = _did()
        _init(did)
        r = requests.post(f"{API}/auth/magic-link/request",
                          json={"device_id": did, "email": email,
                                "origin_url": "https://example.test"}, timeout=15)
        assert r.status_code == 429, f"expected 429, got {r.status_code} {r.text}"
        body = r.json()
        detail = body.get("detail", "")
        # Either message acceptable per the limit ordering but email check is preferred
        assert "Too many sign-in requests" in detail, f"unexpected detail: {detail}"


# -------------------- ALLOW_DEV_MAGIC_LINK gate --------------------
class TestDevMagicLinkGate:
    def test_dev_link_returned_default(self):
        """With ALLOW_DEV_MAGIC_LINK=1 (default) and RESEND_API_KEY unset,
        dev_link must be returned in the response so the dev flow works."""
        did = _did()
        _init(did)
        email = f"TEST_devlink_{uuid.uuid4().hex[:8]}@example.test"
        r = requests.post(f"{API}/auth/magic-link/request",
                          json={"device_id": did, "email": email,
                                "origin_url": "https://example.test"}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["email"] == email.lower()
        # In current dev env: RESEND not set -> dev_link must be present
        assert body.get("dev_link"), "dev_link should be present when ALLOW_DEV_MAGIC_LINK=1 and RESEND not configured"
        assert "token=" in body["dev_link"]
        assert body.get("expires_in") == 900


# -------------------- Regression --------------------
class TestRegression:
    def test_users_init_works(self):
        did = _did()
        body = _init(did)
        assert body["device_id"] == did
        assert "premium" in body
        assert body["premium"]["tier"] in ("trial", "free", "monthly", "lifetime")

    def test_checkout_session_creates_aud(self):
        did = _did()
        _init(did)
        r = requests.post(f"{API}/checkout/session",
                          json={"device_id": did, "package": "monthly",
                                "origin_url": "https://example.test"}, timeout=20)
        # In some envs STRIPE may not be configured; accept either ok or 500
        if r.status_code == 500 and "Stripe not configured" in r.text:
            pytest.skip("STRIPE not configured in this env")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "url" in body and "session_id" in body
        # Verify the txn was persisted with AUD currency
        txn = _db.payment_transactions.find_one({"session_id": body["session_id"]})
        assert txn is not None
        assert txn["currency"] == "aud"
        assert txn["amount"] == 3.99

    def test_affiliate_preview(self):
        r = requests.get(f"{API}/affiliate/preview", timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body["rev_share_percent"] == 30
        assert body["enabled"] is False
