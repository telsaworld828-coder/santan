import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { CadenceWordmark } from "@/components/AppHeader";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { PinModal } from "@/components/PinModal";
import { findUserByEmail } from "@/lib/store";
import { setClientSession, isClientAuthed } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@santander.app");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinUser, setPinUser] = useState<{
    name: string; email: string; avatar?: string; pin: string; userId: string;
  } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isClientAuthed()) { navigate({ to: "/dashboard" }); return; }
    emailRef.current?.focus();
  }, [navigate]);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    // Small defer so the loading state renders before the synchronous lookup
    requestAnimationFrame(() => {
      const u = findUserByEmail(email);
      if (!u || u.password !== password) {
        setError("Incorrect email or password.");
        setLoading(false);
        return;
      }
      setPinUser({ name: u.name, email: u.email, avatar: u.avatar, pin: u.pin, userId: u.id });
      setPinOpen(true);
      setLoading(false);
    });
  }

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col">
        <div className="bg-primary text-primary-foreground px-6 pt-16 pb-12 rounded-b-[2rem]">
          <CadenceWordmark className="text-2xl" />
          <h1 className="mt-10 text-3xl font-display font-bold leading-tight">Welcome back.</h1>
          <p className="mt-2 text-primary-foreground/80 text-sm">Your money, in rhythm.</p>
        </div>

        <form onSubmit={onSubmit} className="flex-1 px-6 pt-8 pb-6 flex flex-col" noValidate>
          <label className="block" htmlFor="login-email">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              id="login-email" ref={emailRef} type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pwRef.current?.focus(); } }}
              autoComplete="email" inputMode="email" enterKeyHint="next"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              className="mt-1.5 w-full h-12 rounded-xl border border-input bg-card px-4 text-sm transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          </label>

          <label className="block mt-4" htmlFor="login-password">
            <span className="text-sm font-medium text-foreground">Password</span>
            <div className="relative mt-1.5">
              <input
                id="login-password" ref={pwRef} type={showPw ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                autoComplete="current-password" enterKeyHint="go" spellCheck={false}
                className="w-full h-12 rounded-xl border border-input bg-card pl-4 pr-12 text-sm transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition" tabIndex={-1}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

          <div className="mt-auto pt-8 space-y-3">
            <button type="submit" disabled={!canSubmit}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              style={{ touchAction: "manipulation" }}>
              {loading ? (<><Loader2 className="size-4 animate-spin" />Signing in…</>) : "Log in"}
            </button>
            <Link to="/admin/login"
              className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
              <BookOpen className="size-3.5" />Admin console
            </Link>
          </div>
        </form>
      </div>

      {pinUser && (
        <PinModal open={pinOpen} onClose={() => setPinOpen(false)} user={pinUser}
          expectedPin={pinUser.pin}
          onSuccess={() => {
            setPinOpen(false);
            setClientSession(pinUser.userId, pinUser.email);
            navigate({ to: "/dashboard" });
          }} />
      )}
    </PhoneFrame>
  );
}
