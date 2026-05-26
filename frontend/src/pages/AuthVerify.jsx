import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { usePremium } from "../context/PremiumContext";
import { verifyMagicLink } from "../lib/api";
import { getDeviceId } from "../lib/device";
import { track } from "../lib/analytics";

export default function AuthVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshPremium } = usePremium();
  const [state, setState] = useState("verifying"); // verifying | success | error
  const [account, setAccount] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setErrMsg("This link is missing its token. Try requesting a fresh one from Settings.");
      return;
    }
    const did = getDeviceId();
    track("auth_verify_started");
    verifyMagicLink(token, did)
      .then(async (data) => {
        setAccount(data.account);
        setState("success");
        await refreshPremium(did);
        track("auth_verify_succeeded", { devices: data.account?.linked_device_count });
        // Auto-redirect to settings after a beat
        setTimeout(() => navigate("/settings"), 2500);
      })
      .catch((e) => {
        const detail = e?.response?.data?.detail || "Link is invalid or expired.";
        setErrMsg(detail);
        setState("error");
        track("auth_verify_failed", { reason: detail });
      });
  }, [params, navigate, refreshPremium]);

  return (
    <div data-testid="auth-verify-page" className="space-y-6 pt-4">
      <SeoHead
        title="Signing you in — Cheese on Toast"
        description="Verifying your sign-in link."
        canonicalPath="/auth/verify"
      />

      {state === "verifying" && (
        <div className="brut-card p-8 text-center space-y-3" data-testid="verify-loading">
          <Loader2 size={36} className="animate-spin mx-auto text-brand-primary" />
          <div className="font-display font-black uppercase text-lg">Signing you in...</div>
          <div className="font-mono text-xs text-foreground/60">Linking this device to your account.</div>
        </div>
      )}

      {state === "success" && (
        <div className="space-y-4" data-testid="verify-success">
          <div className="brut-card-yellow p-6 space-y-3">
            <CheckCircle2 size={28} className="text-ink" />
            <div className="font-display font-black uppercase text-2xl leading-tight">You're signed in.</div>
            <div className="font-mono text-sm">
              <strong>{account?.email}</strong> · {account?.linked_device_count} device{account?.linked_device_count === 1 ? "" : "s"} now linked.
              {account?.premium?.is_premium && " Your premium follows you across all of them."}
            </div>
          </div>
          <Link to="/settings" data-testid="verify-success-continue" className="btn-arcade w-full">
            Continue to Settings
          </Link>
        </div>
      )}

      {state === "error" && (
        <div className="brut-card p-6 space-y-3 border-brand-danger" data-testid="verify-error">
          <AlertTriangle size={24} className="text-brand-danger" />
          <div className="font-display font-black uppercase text-xl">Couldn't sign you in</div>
          <p className="font-mono text-sm text-foreground/80">{errMsg}</p>
          <Link to="/settings" data-testid="verify-error-back" className="btn-arcade w-full">
            Back to Settings
          </Link>
        </div>
      )}
    </div>
  );
}
