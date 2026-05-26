"""Cheese on Toast — Premium subscription backend.

Anonymous device-id based identity. Stripe Checkout (one-time payments) used to:
  - Grant 30 days of premium for the monthly package ($3.99)
  - Grant lifetime premium for the lifetime package ($24.99)
A 3-day free trial is auto-granted on the first /api/users/init call.
"""

from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import logging
import uuid

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

STRIPE_KEY = os.environ.get("STRIPE_API_KEY")
ALLOW_DEV_MAGIC_LINK = os.environ.get("ALLOW_DEV_MAGIC_LINK", "1") == "1"  # set to 0 in prod

app = FastAPI(title="Cheese on Toast API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cot")


# -----------------------------------------------------------------------------
# Simple in-memory rate-limiter (fine for single-process dev/MVP).
# Replace with Redis or Mongo TTL if running multiple instances.
# -----------------------------------------------------------------------------
class _RateLimiter:
    def __init__(self):
        self._hits: Dict[str, List[float]] = {}

    def hit(self, key: str, max_count: int, window_seconds: int) -> bool:
        """Returns True if allowed; False if rate-limited."""
        from time import time
        now_ts = time()
        window_start = now_ts - window_seconds
        hits = [t for t in self._hits.get(key, []) if t > window_start]
        if len(hits) >= max_count:
            self._hits[key] = hits
            return False
        hits.append(now_ts)
        self._hits[key] = hits
        return True

rate_limiter = _RateLimiter()


@app.on_event("startup")
async def _on_startup():
    """Create idempotent indexes for hot collections."""
    try:
        await db.users.create_index("device_id", unique=True)
        await db.accounts.create_index("email", unique=True)
        await db.magic_links.create_index("token", unique=True)
        # TTL index — Mongo auto-deletes documents 60s after expires_at.
        # We store expires_at as ISO string, so we add a parallel `expires_dt`
        # field at insert-time below for TTL to work. Keep this index even if
        # field absent (no-op for those docs).
        await db.magic_links.create_index("expires_dt", expireAfterSeconds=0)
        await db.payment_transactions.create_index("session_id", unique=True)
        await db.analytics_events.create_index([("timestamp", -1)])
        logger.info("Indexes ensured")
    except Exception as e:
        logger.warning("Index setup failed: %s", e)

# -----------------------------------------------------------------------------
# Packages — defined on backend ONLY for security
# -----------------------------------------------------------------------------
PACKAGES = {
    "monthly":  {"amount": 3.99,  "currency": "aud", "label": "1 month premium", "extends_days": 30,   "lifetime": False},
    "lifetime": {"amount": 24.99, "currency": "aud", "label": "Lifetime premium", "extends_days": None, "lifetime": True},
}

TRIAL_DAYS = 3

def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class InitRequest(BaseModel):
    device_id: str
    referrer_device_id: Optional[str] = None
    platform: Optional[str] = "web"


class PremiumStatus(BaseModel):
    is_premium: bool
    tier: str  # "free" | "trial" | "monthly" | "lifetime"
    trial_used: bool = False
    trial_ends_at: Optional[str] = None
    premium_until: Optional[str] = None
    is_lifetime: bool = False


class UserResponse(BaseModel):
    device_id: str
    created_at: str
    premium: PremiumStatus


class CheckoutRequest(BaseModel):
    device_id: str
    package: str  # "monthly" | "lifetime"
    origin_url: str


class CheckoutResponse(BaseModel):
    url: str
    session_id: str


class CheckoutStatus(BaseModel):
    payment_status: str
    status: str
    amount_total: int
    currency: str
    package: Optional[str] = None
    granted: bool


class AnalyticsEvent(BaseModel):
    device_id: str
    event: str
    properties: Optional[Dict[str, Any]] = None


class MagicLinkRequest(BaseModel):
    device_id: str
    email: str
    origin_url: Optional[str] = None


class MagicLinkResponse(BaseModel):
    ok: bool
    email: str
    dev_link: Optional[str] = None  # Returned only when no email provider configured
    expires_in: int = 900


class VerifyMagicLinkRequest(BaseModel):
    token: str
    device_id: str


class AccountInfo(BaseModel):
    email: str
    linked_device_count: int
    premium: PremiumStatus


# -----------------------------------------------------------------------------
# Email + magic link helpers
# -----------------------------------------------------------------------------
import secrets

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")  # backend-only; never expose to client
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "Cheese on Toast <onboarding@resend.dev>")
MAGIC_LINK_TTL_SECONDS = 900  # 15 min


async def _send_magic_link_email(email: str, link: str) -> bool:
    """Send a magic-link email via Resend.

    Reads RESEND_API_KEY from the server environment ONLY. The key is never
    placed in logs, responses, or any client-side code. Returns True when
    the email provider accepted the request.
    """
    if not RESEND_API_KEY:
        # No provider configured — caller falls back to dev-mode dev_link.
        return False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as cx:
            r = await cx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": RESEND_FROM_EMAIL,
                    "to": [email],
                    "subject": "Your Cheese on Toast sign-in link",
                    "html": (
                        "<div style=\"font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#09090B;color:#FAFAFA;border:2px solid #FACC15\">"
                        "<h1 style=\"font-family:'Unbounded',sans-serif;text-transform:uppercase;letter-spacing:-0.02em;font-size:24px;margin:0 0 16px\">Sign in</h1>"
                        "<p style=\"font-size:14px;line-height:1.5\">Tap the button to sign in and sync your premium across devices.</p>"
                        f"<p style=\"margin:24px 0\"><a href=\"{link}\" style=\"display:inline-block;background:#FACC15;color:#09090B;font-weight:700;text-transform:uppercase;padding:14px 24px;text-decoration:none;border:2px solid #FAFAFA\">Sign me in</a></p>"
                        "<p style=\"font-size:12px;color:#999\">Link expires in 15 minutes. If you didn't request this, ignore this email.</p>"
                        "</div>"
                    ),
                },
            )
            if r.status_code < 400:
                logger.info("magic_link_email_sent provider=resend status=%s", r.status_code)
                return True
            # Log status only — never the response body (could echo headers) or key
            logger.warning("magic_link_email_failed provider=resend status=%s", r.status_code)
            return False
    except Exception as e:
        # Log exception type only, not args (defensive)
        logger.warning("magic_link_email_exception provider=resend type=%s", type(e).__name__)
        return False


def _is_email(s: str) -> bool:
    s = (s or "").strip()
    return "@" in s and "." in s.split("@")[-1] and len(s) <= 254


async def _get_account(email: str) -> Optional[dict]:
    return await db.accounts.find_one({"email": email.lower()}, {"_id": 0})


async def _resolve_premium(user_doc: dict) -> PremiumStatus:
    """If the device is linked to an account, return the account's premium.
    Otherwise return the device's premium."""
    if not user_doc:
        return PremiumStatus(is_premium=False, tier="free")
    email = user_doc.get("account_email")
    if email:
        acc = await _get_account(email)
        if acc:
            return _compute_premium(acc)
    return _compute_premium(user_doc)


def _better_premium(a: dict, b: dict) -> dict:
    """Pick the stronger premium state across two docs (acc + user)."""
    if a.get("is_lifetime") or b.get("is_lifetime"):
        return {"is_lifetime": True, "premium_until": None,
                "trial_used": a.get("trial_used", False) or b.get("trial_used", False),
                "trial_ends_at": a.get("trial_ends_at") or b.get("trial_ends_at")}
    # Pick whichever premium_until is later
    def _parse(d):
        s = d.get("premium_until")
        if not s:
            return None
        try:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None
    pa, pb = _parse(a), _parse(b)
    best = max([p for p in (pa, pb) if p is not None], default=None)
    return {
        "is_lifetime": False,
        "premium_until": iso(best) if best else None,
        "trial_used": a.get("trial_used", False) or b.get("trial_used", False),
        "trial_ends_at": a.get("trial_ends_at") or b.get("trial_ends_at"),
    }


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _compute_premium(user_doc: dict) -> PremiumStatus:
    """Derive current premium status from stored fields."""
    if not user_doc:
        return PremiumStatus(is_premium=False, tier="free")

    if user_doc.get("is_lifetime"):
        return PremiumStatus(
            is_premium=True,
            tier="lifetime",
            trial_used=user_doc.get("trial_used", False),
            trial_ends_at=user_doc.get("trial_ends_at"),
            premium_until=None,
            is_lifetime=True,
        )

    n = now()
    premium_until_str = user_doc.get("premium_until")
    if premium_until_str:
        try:
            premium_until = datetime.fromisoformat(premium_until_str)
            if premium_until.tzinfo is None:
                premium_until = premium_until.replace(tzinfo=timezone.utc)
            if premium_until > n:
                # Determine if still in trial or paid
                trial_ends_at_str = user_doc.get("trial_ends_at")
                tier = "monthly"
                if trial_ends_at_str:
                    trial_end = datetime.fromisoformat(trial_ends_at_str)
                    if trial_end.tzinfo is None:
                        trial_end = trial_end.replace(tzinfo=timezone.utc)
                    if premium_until <= trial_end:
                        tier = "trial"
                return PremiumStatus(
                    is_premium=True,
                    tier=tier,
                    trial_used=user_doc.get("trial_used", False),
                    trial_ends_at=user_doc.get("trial_ends_at"),
                    premium_until=premium_until_str,
                    is_lifetime=False,
                )
        except Exception:
            pass

    return PremiumStatus(
        is_premium=False,
        tier="free",
        trial_used=user_doc.get("trial_used", False),
        trial_ends_at=user_doc.get("trial_ends_at"),
        premium_until=premium_until_str,
        is_lifetime=False,
    )


async def _grant_package(device_id: str, package: str) -> dict:
    """Extend or set premium for the user based on the package.

    If the device is linked to an account, grant happens at the account level
    so all linked devices benefit.
    """
    pkg = PACKAGES.get(package)
    if not pkg:
        raise HTTPException(400, f"Unknown package: {package}")

    user = await db.users.find_one({"device_id": device_id})
    if not user:
        raise HTTPException(404, "User not found")

    target_email = user.get("account_email")

    # Compute new premium state from the target's existing state
    if target_email:
        target = await _get_account(target_email)
        if not target:
            target = {}
    else:
        target = user

    update: Dict[str, Any] = {"updated_at": iso(now())}
    if pkg["lifetime"]:
        update["is_lifetime"] = True
        update["premium_until"] = None
    else:
        n = now()
        current = target.get("premium_until")
        base = n
        if current:
            try:
                cur_dt = datetime.fromisoformat(current)
                if cur_dt.tzinfo is None:
                    cur_dt = cur_dt.replace(tzinfo=timezone.utc)
                if cur_dt > n:
                    base = cur_dt
            except Exception:
                pass
        new_end = base + timedelta(days=pkg["extends_days"])
        update["premium_until"] = iso(new_end)

    if target_email:
        await db.accounts.update_one({"email": target_email}, {"$set": update})
    else:
        await db.users.update_one({"device_id": device_id}, {"$set": update})
    return update


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"status": "ok", "service": "cheese-on-toast"}


@api.post("/users/init", response_model=UserResponse)
async def users_init(body: InitRequest):
    """Create or fetch an anonymous user. First-time creation auto-grants 3-day trial."""
    device_id = body.device_id.strip()
    if not device_id or len(device_id) < 8:
        raise HTTPException(400, "Invalid device_id")

    user = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    if not user:
        n = now()
        trial_end = n + timedelta(days=TRIAL_DAYS)
        user = {
            "device_id": device_id,
            "created_at": iso(n),
            "updated_at": iso(n),
            "platform": body.platform or "web",
            "referrer_device_id": body.referrer_device_id,
            "trial_used": True,
            "trial_ends_at": iso(trial_end),
            "premium_until": iso(trial_end),
            "is_lifetime": False,
        }
        await db.users.insert_one(user.copy())
        logger.info("New user %s — granted %d-day trial until %s", device_id, TRIAL_DAYS, iso(trial_end))

        # Record referral if present (placeholder for revenue share later)
        if body.referrer_device_id and body.referrer_device_id != device_id:
            await db.referrals.insert_one({
                "device_id": device_id,
                "referred_by_device_id": body.referrer_device_id,
                "created_at": iso(n),
                "rewarded": False,
            })

        # Analytics
        await db.analytics_events.insert_one({
            "device_id": device_id,
            "event": "user_init",
            "properties": {"trial_granted": True, "referrer": body.referrer_device_id},
            "timestamp": iso(n),
        })

    premium = await _resolve_premium(user)
    return UserResponse(
        device_id=device_id,
        created_at=user["created_at"],
        premium=premium,
    )


@api.get("/users/{device_id}/premium", response_model=PremiumStatus)
async def get_premium(device_id: str):
    user = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return await _resolve_premium(user)


@api.post("/checkout/session", response_model=CheckoutResponse)
async def create_checkout(body: CheckoutRequest, request: Request):
    if body.package not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    user = await db.users.find_one({"device_id": body.device_id})
    if not user:
        raise HTTPException(404, "User not found")
    if not STRIPE_KEY:
        raise HTTPException(500, "Stripe not configured")

    pkg = PACKAGES[body.package]
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/premium/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/premium"

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_KEY, webhook_url=webhook_url)

    metadata = {
        "device_id": body.device_id,
        "package": body.package,
        "source": "cot_web",
    }
    req = CheckoutSessionRequest(
        amount=float(pkg["amount"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(req)

    # MANDATORY: create transaction record BEFORE returning
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "device_id": body.device_id,
        "package": body.package,
        "amount": float(pkg["amount"]),
        "currency": pkg["currency"],
        "payment_status": "initiated",
        "metadata": metadata,
        "created_at": iso(now()),
        "updated_at": iso(now()),
        "granted": False,
    })

    return CheckoutResponse(url=session.url, session_id=session.session_id)


@api.get("/checkout/status/{session_id}", response_model=CheckoutStatus)
async def checkout_status(session_id: str, request: Request):
    if not STRIPE_KEY:
        raise HTTPException(500, "Stripe not configured")
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Transaction not found")

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    update: Dict[str, Any] = {
        "payment_status": status.payment_status,
        "status": status.status,
        "amount_total": status.amount_total,
        "updated_at": iso(now()),
    }
    granted = txn.get("granted", False)
    if status.payment_status == "paid" and not granted:
        # Grant the package — idempotent via the `granted` flag
        await _grant_package(txn["device_id"], txn["package"])
        update["granted"] = True
        await db.analytics_events.insert_one({
            "device_id": txn["device_id"],
            "event": "purchase_completed",
            "properties": {"package": txn["package"], "amount": txn["amount"]},
            "timestamp": iso(now()),
        })
        # If user was referred, mark referral rewarded
        user = await db.users.find_one({"device_id": txn["device_id"]})
        if user and user.get("referrer_device_id"):
            await db.referrals.update_one(
                {"device_id": txn["device_id"]},
                {"$set": {"rewarded": True, "rewarded_at": iso(now())}},
            )
        granted = True

    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    return CheckoutStatus(
        payment_status=status.payment_status,
        status=status.status,
        amount_total=status.amount_total,
        currency=status.currency,
        package=txn.get("package"),
        granted=granted,
    )


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Webhook handler — extra layer in case redirect-back doesn't fire."""
    if not STRIPE_KEY:
        return {"ok": False, "reason": "stripe_not_configured"}
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_KEY, webhook_url=webhook_url)
    try:
        resp = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        logger.warning("Webhook parse failed: %s", e)
        return {"ok": False, "error": str(e)}

    if resp and getattr(resp, "session_id", None) and getattr(resp, "payment_status", None) == "paid":
        sid = resp.session_id
        txn = await db.payment_transactions.find_one({"session_id": sid})
        if txn and not txn.get("granted"):
            await _grant_package(txn["device_id"], txn["package"])
            await db.payment_transactions.update_one(
                {"session_id": sid},
                {"$set": {"granted": True, "payment_status": "paid", "updated_at": iso(now())}},
            )
            logger.info("Webhook granted %s for %s", txn["package"], txn["device_id"])
    return {"ok": True}


@api.post("/analytics/event")
async def analytics_event(body: AnalyticsEvent):
    """Lightweight analytics ingestion. No PII expected."""
    await db.analytics_events.insert_one({
        "device_id": body.device_id,
        "event": body.event,
        "properties": body.properties or {},
        "timestamp": iso(now()),
    })
    return {"ok": True}


@api.get("/affiliate/preview")
async def affiliate_preview():
    """Placeholder for the future affiliate program."""
    return {
        "enabled": False,
        "title": "Cheese on Toast Affiliate Program",
        "description": "Earn 30% recurring on every premium subscriber you refer. Coming soon.",
        "rev_share_percent": 30,
        "cookie_window_days": 30,
        "waitlist_open": True,
    }


@api.get("/health/email")
async def health_email():
    """Returns whether the email provider is configured. No secrets exposed."""
    return {
        "provider": "resend" if RESEND_API_KEY else "none",
        "configured": bool(RESEND_API_KEY),
        "dev_link_fallback": ALLOW_DEV_MAGIC_LINK and not RESEND_API_KEY,
    }


# -----------------------------------------------------------------------------
# Magic-link authentication
# -----------------------------------------------------------------------------
@api.post("/auth/magic-link/request", response_model=MagicLinkResponse)
async def magic_link_request(body: MagicLinkRequest):
    email = (body.email or "").strip().lower()
    if not _is_email(email):
        raise HTTPException(400, "Invalid email")
    user = await db.users.find_one({"device_id": body.device_id})
    if not user:
        raise HTTPException(404, "Device not initialised")

    # Rate limit: 3 requests per device per 10 min, 5 per email per hour
    if not rate_limiter.hit(f"ml-dev:{body.device_id}", max_count=3, window_seconds=600):
        raise HTTPException(429, "Too many sign-in requests. Try again in a few minutes.")
    if not rate_limiter.hit(f"ml-email:{email}", max_count=5, window_seconds=3600):
        raise HTTPException(429, "Too many sign-in requests for this email. Try again in an hour.")

    token = secrets.token_urlsafe(28)
    n = now()
    expires = n + timedelta(seconds=MAGIC_LINK_TTL_SECONDS)
    await db.magic_links.insert_one({
        "token": token,
        "email": email,
        "device_id": body.device_id,
        "created_at": iso(n),
        "expires_at": iso(expires),
        "expires_dt": expires,  # for TTL index (BSON date)
        "used": False,
    })

    origin = (body.origin_url or "").rstrip("/") or ""
    link = f"{origin}/auth/verify?token={token}" if origin else f"/auth/verify?token={token}"

    sent = await _send_magic_link_email(email, link)
    await db.analytics_events.insert_one({
        "device_id": body.device_id,
        "event": "magic_link_requested",
        "properties": {"email_domain": email.split("@")[-1], "sent": sent},
        "timestamp": iso(n),
    })

    # Dev-mode fallback: return the link directly so the flow works without an
    # email provider configured. GATED behind ALLOW_DEV_MAGIC_LINK env flag
    # (default on for dev; MUST be disabled in production).
    dev_link = None
    if not sent and ALLOW_DEV_MAGIC_LINK:
        dev_link = link
    elif not sent and not ALLOW_DEV_MAGIC_LINK:
        # Don't leak the token in prod. Pretend we sent successfully.
        logger.error("Magic link could not be emailed (no provider) and dev fallback disabled; user will not receive link")
    return MagicLinkResponse(
        ok=True,
        email=email,
        dev_link=dev_link,
        expires_in=MAGIC_LINK_TTL_SECONDS,
    )


@api.post("/auth/magic-link/verify")
async def magic_link_verify(body: VerifyMagicLinkRequest):
    rec = await db.magic_links.find_one({"token": body.token})
    if not rec:
        raise HTTPException(400, "Invalid or expired link")
    if rec.get("used"):
        raise HTTPException(400, "Link already used")
    try:
        exp = datetime.fromisoformat(rec["expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now():
            raise HTTPException(400, "Link expired")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Invalid link")

    email = rec["email"]
    device_id = body.device_id

    # Ensure device exists
    user = await db.users.find_one({"device_id": device_id})
    if not user:
        raise HTTPException(404, "Device not initialised")

    # Find or create account
    account = await db.accounts.find_one({"email": email})
    if not account:
        account = {
            "email": email,
            "created_at": iso(now()),
            "updated_at": iso(now()),
            "is_lifetime": False,
            "premium_until": None,
            "trial_used": False,
            "trial_ends_at": None,
            "device_ids": [device_id],
        }
        # Inherit any premium the device currently has so we don't downgrade
        merged = _better_premium(user, account)
        account.update(merged)
        await db.accounts.insert_one(account.copy())
    else:
        # Merge premium upward (best of account vs device)
        merged = _better_premium(account, user)
        await db.accounts.update_one(
            {"email": email},
            {"$set": {**merged, "updated_at": iso(now())},
             "$addToSet": {"device_ids": device_id}},
        )

    # Link the device to the account
    await db.users.update_one(
        {"device_id": device_id},
        {"$set": {"account_email": email, "updated_at": iso(now())}},
    )
    await db.magic_links.update_one({"token": body.token}, {"$set": {"used": True, "used_at": iso(now())}})

    await db.analytics_events.insert_one({
        "device_id": device_id,
        "event": "magic_link_verified",
        "properties": {"email_domain": email.split("@")[-1]},
        "timestamp": iso(now()),
    })

    refreshed_user = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    premium = await _resolve_premium(refreshed_user)
    acc_after = await _get_account(email)
    return {
        "ok": True,
        "account": {
            "email": email,
            "linked_device_count": len(acc_after.get("device_ids", [])) if acc_after else 1,
            "premium": premium.model_dump(),
        },
    }


@api.get("/account/me")
async def account_me(device_id: str):
    user = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "Device not initialised")
    email = user.get("account_email")
    if not email:
        return {"linked": False}
    acc = await _get_account(email)
    if not acc:
        return {"linked": False}
    return {
        "linked": True,
        "email": email,
        "linked_device_count": len(acc.get("device_ids", [])),
        "premium": (await _resolve_premium(user)).model_dump(),
    }


class UnlinkRequest(BaseModel):
    device_id: str


@api.post("/account/unlink")
async def account_unlink(body: UnlinkRequest):
    device_id = body.device_id
    if not device_id:
        raise HTTPException(400, "device_id required")
    user = await db.users.find_one({"device_id": device_id})
    if not user or not user.get("account_email"):
        return {"ok": True}
    email = user["account_email"]
    await db.users.update_one({"device_id": device_id}, {"$unset": {"account_email": ""}})
    await db.accounts.update_one({"email": email}, {"$pull": {"device_ids": device_id}})
    return {"ok": True}


# -----------------------------------------------------------------------------
# Wire-up
# -----------------------------------------------------------------------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
