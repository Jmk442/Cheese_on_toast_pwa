import { useEffect, useState } from "react";
import { Mail, Send, LogOut, ExternalLink, Loader2, Check } from "lucide-react";
import { usePremium } from "../context/PremiumContext";
import { requestMagicLink, getAccountMe, unlinkAccount } from "../lib/api";
import { getDeviceId } from "../lib/device";
import { track } from "../lib/analytics";

/**
 * Account link card for the Settings page. Lets the user attach their device
 * to an email account so premium follows them across devices.
 */
export const AccountLinkCard = () => {
  const { refreshPremium } = usePremium();
  const [account, setAccount] = useState(null);   // {linked, email, linked_device_count, premium} | null
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [devLink, setDevLink] = useState(null);
  const [sentMsg, setSentMsg] = useState(null);
  const [err, setErr] = useState(null);
  const did = getDeviceId();

  const refresh = async () => {
    try {
      const data = await getAccountMe(did);
      setAccount(data);
    } catch {
      setAccount({ linked: false });
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleRequest = async (e) => {
    e?.preventDefault?.();
    setErr(null); setSentMsg(null); setDevLink(null);
    if (!email.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    setBusy(true);
    track("magic_link_request", { email_domain: email.split("@")[1] });
    try {
      const data = await requestMagicLink(did, email.trim().toLowerCase(), window.location.origin);
      if (data.dev_link) {
        setDevLink(data.dev_link);
      } else {
        setSentMsg(`Check ${data.email} for your sign-in link. It expires in 15 minutes.`);
      }
    } catch (e2) {
      setErr(e2?.response?.data?.detail || "Couldn't send link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm("Unlink this device from your account? Your premium will stay on the account but this device will revert to its own state.")) return;
    try {
      await unlinkAccount(did);
      track("account_unlinked");
      await refresh();
      await refreshPremium(did);
    } catch { /* noop */ }
  };

  if (account?.linked) {
    return (
      <section data-testid="settings-account-linked" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl inline-flex items-center gap-2"><Mail size={18} /> Email Account</h2>
        <div className="brut-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-brand-primary" />
            <span className="font-display font-bold uppercase text-sm">Linked</span>
          </div>
          <div className="font-mono text-sm text-foreground/80" data-testid="linked-email">{account.email}</div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/50">
            {account.linked_device_count} device{account.linked_device_count === 1 ? "" : "s"} on this account
          </div>
          <button
            type="button"
            data-testid="account-unlink"
            onClick={handleUnlink}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-foreground/60 hover:text-brand-danger mt-1"
          >
            <LogOut size={12} /> Unlink this device
          </button>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="settings-account-unlinked" className="space-y-3">
      <h2 className="font-display font-black uppercase tracking-tight text-xl inline-flex items-center gap-2"><Mail size={18} /> Link Your Email</h2>
      <div className="brut-card p-4 space-y-3">
        <p className="font-mono text-sm text-foreground/80">
          Sync your premium across phone, tablet & laptop. We email a one-tap sign-in link — no passwords.
        </p>
        <form onSubmit={handleRequest} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            data-testid="auth-email-input"
            className="flex-1 bg-ink border-2 border-white/30 p-2 font-mono text-sm focus:border-brand-primary outline-none"
          />
          <button type="submit" data-testid="auth-send-link" disabled={busy} className="btn-arcade px-3 py-2">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>

        {sentMsg && (
          <div className="border-2 border-brand-primary/60 p-3 font-mono text-xs text-brand-primary" data-testid="auth-sent">
            {sentMsg}
          </div>
        )}

        {devLink && (
          <div className="border-2 border-brand-primary/60 p-3 space-y-2" data-testid="auth-dev-link">
            <div className="font-mono text-[10px] uppercase tracking-widest text-brand-primary">Dev mode · email provider not configured</div>
            <p className="font-mono text-xs text-foreground/80">In production this would be emailed to <strong>{email}</strong>. For now, tap below to verify:</p>
            <a
              href={devLink}
              data-testid="dev-link-anchor"
              className="btn-arcade w-full inline-flex"
            >
              <ExternalLink size={16} /> Verify Now
            </a>
            <div className="font-mono text-[10px] text-foreground/40 break-all">{devLink}</div>
          </div>
        )}

        {err && (
          <div className="border-2 border-brand-danger p-3 font-mono text-xs text-brand-danger" data-testid="auth-error">
            {err}
          </div>
        )}
      </div>
    </section>
  );
};
