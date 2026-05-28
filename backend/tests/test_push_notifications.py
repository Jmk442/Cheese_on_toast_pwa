"""Backend tests for Web Push Notifications + regression for fixed Resend env."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://toasted-cheese-map.preview.emergentagent.com"
CRON_SECRET = "cot-cron-3kP8nQ4vR2bT7mY9wE5xH1jL6sA8dF"


@pytest.fixture(scope="module")
def device_id():
    did = f"TEST_pushdev_{uuid.uuid4().hex[:12]}"
    r = requests.post(f"{BASE_URL}/api/users/init", json={"device_id": did, "platform": "web"}, timeout=15)
    assert r.status_code == 200, r.text
    return did


# --- VAPID public key ---
def test_vapid_public_key():
    r = requests.get(f"{BASE_URL}/api/push/vapid-public-key", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "public_key" in data
    assert isinstance(data["public_key"], str)
    assert len(data["public_key"]) > 40


# --- Subscribe ---
def test_subscribe_valid(device_id):
    payload = {
        "device_id": device_id,
        "subscription": {
            "endpoint": "https://fcm.googleapis.com/fcm/test",
            "keys": {"p256dh": "x", "auth": "y"},
        },
    }
    r = requests.post(f"{BASE_URL}/api/push/subscribe", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


def test_subscribe_invalid_empty(device_id):
    r = requests.post(f"{BASE_URL}/api/push/subscribe",
                      json={"device_id": device_id, "subscription": {}}, timeout=15)
    assert r.status_code == 400, r.text


# --- Unsubscribe is idempotent ---
def test_unsubscribe_idempotent():
    did = f"TEST_nosubdev_{uuid.uuid4().hex[:10]}"
    r = requests.post(f"{BASE_URL}/api/push/unsubscribe", json={"device_id": did}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


# --- Test push: non-existent device returns 404 ---
def test_push_test_missing_device():
    did = f"TEST_ghost_{uuid.uuid4().hex[:10]}"
    r = requests.post(f"{BASE_URL}/api/push/test", json={"device_id": did}, timeout=15)
    assert r.status_code == 404, r.text


# --- Cron secret enforcement ---
def test_cron_without_secret():
    r = requests.post(f"{BASE_URL}/api/push/send-streak-reminders", timeout=15)
    assert r.status_code == 403, r.text


def test_cron_with_secret():
    r = requests.post(
        f"{BASE_URL}/api/push/send-streak-reminders",
        headers={"x-cron-secret": CRON_SECRET},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert "sent" in data and "skipped" in data and "purged" in data


def test_cron_with_wrong_secret():
    r = requests.post(
        f"{BASE_URL}/api/push/send-streak-reminders",
        headers={"x-cron-secret": "nope"},
        timeout=15,
    )
    assert r.status_code == 403


# --- Email health (RESEND_API_KEY fix regression) ---
def test_email_health_configured():
    r = requests.get(f"{BASE_URL}/api/health/email", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("configured") is True
    assert data.get("provider") == "resend"


# --- Regression: previously-working endpoints ---
def test_root():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_users_init_and_premium_status(device_id):
    # premium status of newly initialised device
    r = requests.get(f"{BASE_URL}/api/users/{device_id}/premium", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["is_premium"] is True  # trial granted on init
    assert data["tier"] == "trial"


def test_affiliate_preview():
    r = requests.get(f"{BASE_URL}/api/affiliate/preview", timeout=15)
    assert r.status_code == 200
    assert "rev_share_percent" in r.json()


def test_magic_link_request_invalid_email(device_id):
    r = requests.post(
        f"{BASE_URL}/api/auth/magic-link/request",
        json={"device_id": device_id, "email": "not-an-email", "origin_url": BASE_URL},
        timeout=15,
    )
    assert r.status_code == 400


# --- Service worker reachability ---
def test_service_worker_reachable():
    r = requests.get(f"{BASE_URL}/sw.js", timeout=15)
    assert r.status_code == 200, r.status_code
    body = r.text
    assert "push" in body.lower()
    assert "showNotification" in body
