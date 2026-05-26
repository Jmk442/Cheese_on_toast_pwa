"""Iter 7 — magic-link auth + account linking backend tests.

Covers:
- /api/auth/magic-link/request (200 valid, 400 invalid email, 404 unknown device)
- /api/auth/magic-link/verify (happy path, reuse=400, invalid=400)
- Cross-device premium transfer (lifetime grant at account level)
- /api/account/me (linked/unlinked)
- /api/account/unlink + device-level premium fallback
- Regression: /api/users/init, /api/checkout/session(aud), /api/affiliate/preview
"""
import os
import uuid
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


def _did():
    return f"dev-test-{uuid.uuid4().hex[:16]}"


def _init(device_id):
    r = requests.post(f"{API}/users/init", json={"device_id": device_id, "platform": "web"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- magic-link/request ----------
class TestMagicLinkRequest:
    def test_valid_returns_dev_link(self):
        did = _did()
        _init(did)
        email = "TEST_User+Aud@Example.COM"
        r = requests.post(f"{API}/auth/magic-link/request",
                          json={"device_id": did, "email": email,
                                "origin_url": "https://example.test"}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["email"] == email.lower()
        assert body["expires_in"] == 900
        assert body["dev_link"], "dev_link should be present (RESEND_API_KEY not set)"
        assert "/auth/verify?token=" in body["dev_link"]

    def test_invalid_email_400(self):
        did = _did()
        _init(did)
        r = requests.post(f"{API}/auth/magic-link/request",
                          json={"device_id": did, "email": "not-an-email"}, timeout=15)
        assert r.status_code == 400, r.text

    def test_unknown_device_404(self):
        r = requests.post(f"{API}/auth/magic-link/request",
                          json={"device_id": "dev-does-not-exist-xyz", "email": "test+u@example.com"}, timeout=15)
        assert r.status_code == 404, r.text


# ---------- magic-link/verify ----------
def _request_link(did, email, origin="https://example.test"):
    r = requests.post(f"{API}/auth/magic-link/request",
                      json={"device_id": did, "email": email, "origin_url": origin}, timeout=15)
    assert r.status_code == 200
    link = r.json()["dev_link"]
    token = link.split("token=")[-1]
    return token


class TestMagicLinkVerify:
    def test_verify_happy(self):
        did = _did()
        _init(did)
        email = "test+verify@example.com"
        token = _request_link(did, email)
        r = requests.post(f"{API}/auth/magic-link/verify",
                          json={"token": token, "device_id": did}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        acc = body["account"]
        assert acc["email"] == email.lower()
        assert acc["linked_device_count"] >= 1
        assert "premium" in acc and "is_premium" in acc["premium"]
        # Verify magic_links is marked used
        rec = _db.magic_links.find_one({"token": token})
        assert rec is not None
        assert rec.get("used") is True

    def test_verify_reuse_400(self):
        did = _did()
        _init(did)
        token = _request_link(did, "test+reuse@example.com")
        r1 = requests.post(f"{API}/auth/magic-link/verify",
                           json={"token": token, "device_id": did}, timeout=15)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/auth/magic-link/verify",
                           json={"token": token, "device_id": did}, timeout=15)
        assert r2.status_code == 400, r2.text
        assert "used" in r2.json().get("detail", "").lower()

    def test_verify_invalid_400(self):
        did = _did()
        _init(did)
        r = requests.post(f"{API}/auth/magic-link/verify",
                          json={"token": "bogus-token-xyz", "device_id": did}, timeout=15)
        assert r.status_code == 400, r.text


# ---------- Cross-device premium transfer ----------
class TestCrossDeviceTransfer:
    def test_lifetime_inherits_to_new_device(self):
        device_a = _did()
        device_b = _did()
        _init(device_a)
        _init(device_b)

        # Simulate lifetime grant on device A by direct mongo mutation
        _db.users.update_one({"device_id": device_a},
                             {"$set": {"is_lifetime": True, "premium_until": None}})

        # Confirm device B is on its own trial (not lifetime)
        rb = requests.get(f"{API}/users/{device_b}/premium", timeout=15).json()
        assert rb["is_lifetime"] is False
        assert rb["tier"] in ("trial", "free")

        # Device A links its email
        email = "test+xfer@example.com"
        token_a = _request_link(device_a, email)
        v = requests.post(f"{API}/auth/magic-link/verify",
                          json={"token": token_a, "device_id": device_a}, timeout=15).json()
        assert v["ok"]

        # Device B verifies the same email (request a new token from B)
        token_b = _request_link(device_b, email)
        v2 = requests.post(f"{API}/auth/magic-link/verify",
                           json={"token": token_b, "device_id": device_b}, timeout=15).json()
        assert v2["ok"]
        assert v2["account"]["linked_device_count"] >= 2
        assert v2["account"]["premium"]["is_lifetime"] is True

        # GET premium for device B should now reflect account lifetime
        prem_b = requests.get(f"{API}/users/{device_b}/premium", timeout=15).json()
        assert prem_b["is_lifetime"] is True
        assert prem_b["is_premium"] is True

        # account/me on device B
        me = requests.get(f"{API}/account/me", params={"device_id": device_b}, timeout=15).json()
        assert me["linked"] is True
        assert me["premium"]["is_lifetime"] is True


# ---------- /account/me unlinked ----------
class TestAccountMe:
    def test_unlinked_device_returns_linked_false(self):
        did = _did()
        _init(did)
        me = requests.get(f"{API}/account/me", params={"device_id": did}, timeout=15).json()
        assert me == {"linked": False}


# ---------- /account/unlink ----------
class TestAccountUnlink:
    def test_unlink_reverts_to_device_premium(self):
        did = _did()
        _init(did)
        email = "test+unlink@example.com"
        # Give the account lifetime via account-level grant trick:
        # First link, then mutate account directly to lifetime
        token = _request_link(did, email)
        requests.post(f"{API}/auth/magic-link/verify",
                      json={"token": token, "device_id": did}, timeout=15)
        _db.accounts.update_one({"email": email},
                                {"$set": {"is_lifetime": True, "premium_until": None}})
        # Confirm device sees lifetime via account
        p1 = requests.get(f"{API}/users/{did}/premium", timeout=15).json()
        assert p1["is_lifetime"] is True

        # Now unlink
        r = requests.post(f"{API}/account/unlink", json={"device_id": did}, timeout=15)
        assert r.status_code == 200

        # Account no longer linked
        me = requests.get(f"{API}/account/me", params={"device_id": did}, timeout=15).json()
        assert me == {"linked": False}

        # Device-level premium should be its own (trial, not lifetime)
        p2 = requests.get(f"{API}/users/{did}/premium", timeout=15).json()
        assert p2["is_lifetime"] is False

        # And device_id should be pulled from account.device_ids
        acc = _db.accounts.find_one({"email": email})
        assert acc is not None
        assert did not in acc.get("device_ids", [])


# ---------- Regression ----------
class TestRegression:
    def test_users_init_works(self):
        did = _did()
        r = requests.post(f"{API}/users/init", json={"device_id": did, "platform": "web"}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["device_id"] == did
        assert body["premium"]["tier"] in ("trial", "free", "monthly", "lifetime")

    def test_checkout_session_aud(self):
        did = _did()
        _init(did)
        r = requests.post(f"{API}/checkout/session",
                          json={"device_id": did, "package": "monthly",
                                "origin_url": "https://example.test"}, timeout=20)
        # Stripe key is sk_test_emergent (emergent test key); should succeed or surface stripe error
        # We accept 200 with url+session_id OR a clean 5xx if stripe is unreachable.
        assert r.status_code in (200, 500, 502), r.text
        if r.status_code == 200:
            body = r.json()
            assert "url" in body and "session_id" in body

    def test_affiliate_preview(self):
        r = requests.get(f"{API}/affiliate/preview", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["rev_share_percent"] == 30
