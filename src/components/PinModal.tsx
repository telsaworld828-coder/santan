import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Landmark } from "lucide-react";

type PinUser = {
  name: string;
  email: string;
  avatar?: string;
};

export function PinModal({
  open,
  onClose,
  user,
  expectedPin,
  onSuccess,
  title = "Enter your PIN",
}: {
  open: boolean;
  onClose: () => void;
  user: PinUser;
  expectedPin: string;
  onSuccess: () => void;
  title?: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError(null);
      setAttempts(0);
      setLocked(false);
      setCooldown(0);
      // Focus the hidden input after the dialog mounts.
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!locked) return;
    if (cooldown <= 0) {
      setLocked(false);
      setAttempts(0);
      setError(null);
      return;
    }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [locked, cooldown]);

  useEffect(() => {
    if (pin.length === 4 && !locked) {
      if (pin === expectedPin) {
        onSuccess();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setShake(true);
        setTimeout(() => setShake(false), 400);
        if (next >= 3) {
          setLocked(true);
          setCooldown(30);
          setError("Too many attempts. Try again in 30s.");
        } else {
          setError(`Incorrect PIN. ${3 - next} attempt${3 - next === 1 ? "" : "s"} left.`);
        }
        setTimeout(() => setPin(""), 250);
      }
    }
  }, [pin, expectedPin, attempts, locked, onSuccess]);

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className={`p-6 flex flex-col items-center text-center ${shake ? "animate-shake" : ""}`}>
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="size-20 rounded-full object-cover ring-4 ring-primary/10"
              />
            ) : (
              <div className="size-20 rounded-full bg-primary/10 text-primary grid place-items-center text-2xl font-display font-semibold ring-4 ring-primary/10">
                {initials || "?"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 ring-2 ring-card rounded-full">
              <span className="size-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                <Landmark className="size-3" />
              </span>
            </div>
          </div>

          <h2 className="mt-4 font-display text-lg font-bold leading-tight">{user.name}</h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>

          <p className="mt-5 text-sm font-medium">{title}</p>
          <p className="text-[11px] text-muted-foreground">Enter your 4-digit PIN to continue</p>

          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="mt-4 flex items-center justify-center gap-3"
            aria-label="PIN entry"
          >
            {[0, 1, 2, 3].map((i) => {
              const filled = pin.length > i;
              const focused = pin.length === i;
              return (
                <span
                  key={i}
                  className={`size-12 rounded-xl border grid place-items-center transition ${
                    filled
                      ? "border-primary bg-primary/5"
                      : focused
                      ? "border-primary ring-2 ring-ring/30"
                      : "border-input bg-card"
                  }`}
                >
                  {filled && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
              );
            })}
          </button>

          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={pin}
            onChange={(e) => {
              if (locked) return;
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(v);
              if (error && v.length < 4) setError(null);
            }}
            maxLength={4}
            disabled={locked}
            className="sr-only"
            aria-label="PIN"
          />

          <p className={`mt-3 text-xs min-h-[1rem] ${error ? "text-rose-600" : "text-muted-foreground"}`}>
            {locked ? `Locked — retry in ${cooldown}s` : error ?? " "}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            Use a different account
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}