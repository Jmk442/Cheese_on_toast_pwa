"""Backend API tests for Cheese-on-Toast Premium subscription system.

Covers: root health, users/init (idempotent + trial), premium status (404),
checkout/session (monthly/lifetime/invalid + txn record), checkout/status,
analytics/event, affiliate/preview, referrer flow.
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # Fallback to reading frontend .env directly
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    return c[DB_NAME]


@pytest.fixture
def device_id():
    return f"TEST-{uuid.uuid4().hex}"


# --- Root / health ---
def test_root_status_ok(session):
    r = session.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "cheese-on-toast"


# --- users/init: new user + trial granted ---
def test_users_init_creates_user_with_trial(session, device_id):
    r = session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["device_id"] == device_id
    assert "created_at" in data
    premium = data["premium"]
    assert premium["is_premium"] is True
    assert premium["tier"] == "trial"
    assert premium["trial_ends_at"] is not None
    assert premium["premium_until"] is not None
    # Trial end ~3 days out
    from datetime import datetime, timezone, timedelta
    trial_end = datetime.fromisoformat(premium["trial_ends_at"])
    delta = trial_end - datetime.now(timezone.utc)
    assert 2 < delta.total_seconds() / 86400 <= 3.1, f"trial end {delta} not ~3 days"


# --- users/init idempotency ---
def test_users_init_idempotent(session, device_id):
    r1 = session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    assert r1.status_code == 200
    created_at_1 = r1.json()["created_at"]
    trial_end_1 = r1.json()["premium"]["trial_ends_at"]

    r2 = session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    assert r2.status_code == 200
    assert r2.json()["created_at"] == created_at_1
    assert r2.json()["premium"]["trial_ends_at"] == trial_end_1


# --- GET premium status ---
def test_get_premium_status_existing(session, device_id):
    session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    r = session.get(f"{BASE_URL}/api/users/{device_id}/premium")
    assert r.status_code == 200
    data = r.json()
    assert data["is_premium"] is True
    assert data["tier"] == "trial"


def test_get_premium_status_unknown_device(session):
    unknown = f"TEST-unknown-{uuid.uuid4().hex}"
    r = session.get(f"{BASE_URL}/api/users/{unknown}/premium")
    assert r.status_code == 404


# --- Checkout session: monthly ---
def test_checkout_monthly_returns_stripe_url(session, mongo, device_id):
    session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    r = session.post(
        f"{BASE_URL}/api/checkout/session",
        json={"device_id": device_id, "package": "monthly", "origin_url": BASE_URL},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "checkout.stripe.com" in data["url"]
    assert data["session_id"]

    # Verify txn record
    txn = mongo.payment_transactions.find_one({"session_id": data["session_id"]})
    assert txn is not None
    assert txn["payment_status"] == "initiated"
    assert txn["granted"] is False
    assert txn["package"] == "monthly"
    assert abs(txn["amount"] - 3.99) < 0.001


# --- Checkout session: lifetime amount ---
def test_checkout_lifetime_amount(session, mongo, device_id):
    session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    r = session.post(
        f"{BASE_URL}/api/checkout/session",
        json={"device_id": device_id, "package": "lifetime", "origin_url": BASE_URL},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "checkout.stripe.com" in data["url"]
    txn = mongo.payment_transactions.find_one({"session_id": data["session_id"]})
    assert txn is not None
    assert abs(txn["amount"] - 24.99) < 0.001
    assert txn["package"] == "lifetime"


# --- Checkout session: invalid package ---
def test_checkout_invalid_package(session, device_id):
    session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    r = session.post(
        f"{BASE_URL}/api/checkout/session",
        json={"device_id": device_id, "package": "bogus", "origin_url": BASE_URL},
    )
    assert r.status_code == 400


# --- Checkout status for fresh session ---
def test_checkout_status_fresh_not_paid(session, device_id):
    session.post(f"{BASE_URL}/api/users/init", json={"device_id": device_id})
    cr = session.post(
        f"{BASE_URL}/api/checkout/session",
        json={"device_id": device_id, "package": "monthly", "origin_url": BASE_URL},
    )
    assert cr.status_code == 200
    sid = cr.json()["session_id"]
    sr = session.get(f"{BASE_URL}/api/checkout/status/{sid}")
    assert sr.status_code == 200
    data = sr.json()
    assert data["payment_status"] != "paid"
    assert data["granted"] is False


# --- Analytics event ---
def test_analytics_event_stored(session, mongo, device_id):
    payload = {"device_id": device_id, "event": "test_event", "properties": {"foo": "bar"}}
    r = session.post(f"{BASE_URL}/api/analytics/event", json=payload)
    assert r.status_code == 200
    assert r.json().get("ok") is True
    doc = mongo.analytics_events.find_one({"device_id": device_id, "event": "test_event"})
    assert doc is not None
    assert doc["properties"]["foo"] == "bar"


# --- Affiliate preview ---
def test_affiliate_preview(session):
    r = session.get(f"{BASE_URL}/api/affiliate/preview")
    assert r.status_code == 200
    data = r.json()
    assert data["rev_share_percent"] == 30
    assert data["cookie_window_days"] == 30
    assert data["waitlist_open"] is True


# --- Referrer flow ---
def test_referrer_flow_creates_referral_record(session, mongo):
    referrer = f"TEST-ref-{uuid.uuid4().hex}"
    referee = f"TEST-new-{uuid.uuid4().hex}"
    session.post(f"{BASE_URL}/api/users/init", json={"device_id": referrer})
    r = session.post(
        f"{BASE_URL}/api/users/init",
        json={"device_id": referee, "referrer_device_id": referrer},
    )
    assert r.status_code == 200
    doc = mongo.referrals.find_one({"device_id": referee})
    assert doc is not None
    assert doc["referred_by_device_id"] == referrer
    assert doc["rewarded"] is False


# --- Cleanup: drop TEST-prefixed users + their referrals + txns ---
def teardown_module(module):
    try:
        c = MongoClient(MONGO_URL)
        db = c[DB_NAME]
        db.users.delete_many({"device_id": {"$regex": "^TEST-"}})
        db.referrals.delete_many({"device_id": {"$regex": "^TEST-"}})
        db.referrals.delete_many({"referred_by_device_id": {"$regex": "^TEST-"}})
        db.payment_transactions.delete_many({"device_id": {"$regex": "^TEST-"}})
        db.analytics_events.delete_many({"device_id": {"$regex": "^TEST-"}})
    except Exception as e:
        print(f"cleanup err: {e}")
