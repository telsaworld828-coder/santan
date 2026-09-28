import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { isAdminAuthed, setAdminSession, adminCredentials } from "@/lib/auth";
import { PinModal } from "@/components/PinModal";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(adminCredentials.email);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdminAuthed()) navigate({ to: "/admin" });
    else emailRef.current?.focus();
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (email !== adminCredentials.email || password !== adminCredentials.password) {
      setError("Incorrect admin credentials.");
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); setPinOpen(true); }, 400);
  }

  return (
    <div className="min-h-dvh bg-secondary/40 grid place-items-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-card p-8">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition mb-4">
          <ChevronLeft className="size-3.5" /> Back to Santander
        </Link>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Santander</p>
            <p className="font-display font-bold leading-tight">Admin console</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Restricted area. Sign in to manage users and transactions.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input ref={emailRef} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
              autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              className="mt-1.5 w-full h-12 rounded-xl border border-input bg-card px-4 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <div className="relative mt-1.5">
              <input type={showPw ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                autoComplete="current-password" placeholder="••••••••"
                className="w-full h-12 rounded-xl border border-input bg-card px-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40" />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <PinModal open={pinOpen} onClose={() => setPinOpen(false)}
        user={{ name: "Admin", email: adminCredentials.email }}
        expectedPin={adminCredentials.pin}
        title="Admin verification"
        onSuccess={() => {
          setPinOpen(false);
          setAdminSession();
          navigate({ to: "/admin" });
        }} />
    </div>
  );
}
