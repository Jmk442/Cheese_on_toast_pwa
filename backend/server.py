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

app = FastAPI(title="Cheese on Toast API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cot")

# -----------------------------------------------------------------------------
# Packages — defined on backend ONLY for security
# -----------------------------------------------------------------------------
PACKAGES = {
    "monthly":  {"amount": 3.99,  "currency": "usd", "label": "1 month premium", "extends_days": 30,   "lifetime": False},
    "lifetime": {"amount": 24.99, "currency": "usd", "label": "Lifetime premium", "extends_days": None, "lifetime": True},
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
    """Extend or set premium for the user based on the package."""
    pkg = PACKAGES.get(package)
    if not pkg:
        raise HTTPException(400, f"Unknown package: {package}")

    user = await db.users.find_one({"device_id": device_id})
    if not user:
        raise HTTPException(404, "User not found")

    update: Dict[str, Any] = {"updated_at": iso(now())}
    if pkg["lifetime"]:
        update["is_lifetime"] = True
        update["premium_until"] = None
    else:
        n = now()
        # If user is already on premium_until in the future, extend from that point
        current = user.get("premium_until")
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

    premium = _compute_premium(user)
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
    return _compute_premium(user)


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
