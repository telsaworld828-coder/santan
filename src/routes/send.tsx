import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { gbp, useStore, selectUser, findUserByBeneficiary, store, type Beneficiary } from "@/lib/store";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ContactSupportModal, type SupportContext } from "@/components/ContactSupportModal";
import { PinModal } from "@/components/PinModal";
import { getClientSession, isClientAuthed } from "@/lib/auth";

const inputCls = "w-full h-12 rounded-xl border border-input bg-card px-4 text-sm transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

export const Route = createFileRoute("/send")({
  component: SendPage,
});

type Step = "form" | "confirm" | "done";

const emptyBeneficiary: Beneficiary = {
  accountName: "",
  accountNumber: "",
  bankName: "",
  bankAddress: "",
  country: "",
  swiftCode: "",
  ibanNumber: "",
};

function SendPage() {
  const navigate = useNavigate();
  const session = getClientSession();
  const userId = session?.userId ?? "";
  const user = useStore(selectUser(userId));

  const [step, setStep] = useState<Step>("form");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportCtx, setSupportCtx] = useState<SupportContext | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [ben, setBen] = useState<Beneficiary>(emptyBeneficiary);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: "/" });
  }, [navigate]);

  const amt = parseFloat(amount || "0");
  const benComplete =
    ben.accountName.trim() && ben.accountNumber.trim() && ben.bankName.trim() &&
    ben.bankAddress.trim() && ben.country.trim() && ben.swiftCode.trim() && ben.ibanNumber.trim();
  const canContinue = amt > 0 && amt <= (user?.balance ?? 0) && !!benComplete;

  function setField<K extends keyof Beneficiary>(key: K, value: string) {
    setBen((b) => ({ ...b, [key]: value }));
  }

  function handleConfirm() {
    if (confirming || !user) return;
    // Double-check blocked
    if (user.status === "frozen") {
      setSupportCtx({ reason: "frozen_account", summary: "Your account has been blocked." });
      setSupportOpen(true);
      return;
    }
    setConfirming(true);

    const recipient = findUserByBeneficiary(ben);

    // No matching admin-created recipient — record failed transfer, no balance change
    if (!recipient) {
      store.recordFailedTransfer({
        senderId: userId,
        amount: amt,
        note: note || undefined,
        beneficiary: ben,
        reason: "Beneficiary not recognised",
      });
      setConfirming(false);
      setSupportCtx({
        reason: "failed_transaction",
        reference: `TX-${Date.now().toString().slice(-8)}`,
        summary: `Send ${gbp(amt)} to ${ben.accountName}`,
      });
      setSupportOpen(true);
      return;
    }

    // Self-transfer guard
    if (recipient.id === userId) {
      setConfirming(false);
      setSupportCtx({
        reason: "failed_transaction",
        reference: `TX-${Date.now().toString().slice(-8)}`,
        summary: "Cannot transfer to your own account.",
      });
      setSupportOpen(true);
      return;
    }

    // Execute internal transfer
    store.executeInternalTransfer({
      senderId: userId,
      recipientId: recipient.id,
      amount: amt,
      note: note || undefined,
      beneficiary: ben,
    });
    setConfirming(false);
    setStep("done");
  }

  if (!user) return null;

  // Blocked — show support modal immediately, go back to dashboard on close
  if (user.status === "frozen") {
    return (
      <PhoneFrame>
        <AppHeader title="Send money" back="/dashboard" />
        <ContactSupportModal
          open={true}
          onOpenChange={(o) => { if (!o) navigate({ to: "/dashboard" }); }}
          context={{ reason: "frozen_account", summary: "Your account has been blocked." }}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <AppHeader title={step === "form" ? "Send money" : step === "confirm" ? "Review transfer" : "Transfer complete"}
        back={step === "form" ? "/dashboard" : undefined} />

      {step === "form" && (
        <>
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-4">
            <Field label="Amount">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-semibold pointer-events-none">£</span>
                <input autoFocus inputMode="decimal" enterKeyHint="next" value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  onBlur={() => { if (amount) { const n = parseFloat(amount); if (!isNaN(n)) setAmount(n.toFixed(2)); } }}
                  placeholder="0.00" className={`${inputCls} pl-8 tabular`} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Available: <span className="tabular">{gbp(user.balance)}</span></p>
            </Field>
            <Field label="Beneficiary account name">
              <input value={ben.accountName} onChange={(e) => setField("accountName", e.target.value)}
                placeholder="Full legal name" autoComplete="name" enterKeyHint="next" className={inputCls} />
            </Field>
            <Field label="Beneficiary account number">
              <input value={ben.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)}
                placeholder="e.g. 88421097" autoComplete="off" spellCheck={false} enterKeyHint="next" className={`${inputCls} tabular`} />
            </Field>
            <Field label="Bank name">
              <input value={ben.bankName} onChange={(e) => setField("bankName", e.target.value)}
                placeholder="e.g. Santander UK" autoComplete="off" enterKeyHint="next" className={inputCls} />
            </Field>
            <Field label="Bank address">
              <input value={ben.bankAddress} onChange={(e) => setField("bankAddress", e.target.value)}
                placeholder="Branch address" autoComplete="off" enterKeyHint="next" className={inputCls} />
            </Field>
            <Field label="Country">
              <input value={ben.country} onChange={(e) => setField("country", e.target.value)}
                placeholder="e.g. United Kingdom" autoComplete="off" enterKeyHint="next" className={inputCls} />
            </Field>
            <Field label="Swift code">
              <input value={ben.swiftCode} onChange={(e) => setField("swiftCode", e.target.value.toUpperCase())}
                placeholder="e.g. ABBYGB2L" autoComplete="off" spellCheck={false} enterKeyHint="next" className={`${inputCls} tabular uppercase`} />
            </Field>
            <Field label="IBAN number">
              <input value={ben.ibanNumber} onChange={(e) => setField("ibanNumber", e.target.value.toUpperCase())}
                placeholder="e.g. GB29 ABBY 0429 1588 4210 97" autoComplete="off" spellCheck={false} enterKeyHint="done" className={`${inputCls} tabular uppercase`} />
            </Field>
            <Field label="Note (optional)">
              <input value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Rent June" maxLength={40} enterKeyHint="done" className={inputCls} />
            </Field>
          </div>
          <StickyFooter>
            <button onClick={() => navigate({ to: "/dashboard" })}
              className="flex-1 h-12 rounded-full bg-secondary text-foreground font-semibold text-sm" style={{ touchAction: "manipulation" }}>Cancel</button>
            <button disabled={!canContinue} onClick={() => setStep("confirm")}
              className="flex-[2] h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50" style={{ touchAction: "manipulation" }}>Continue</button>
          </StickyFooter>
        </>
      )}

      {step === "confirm" && (
        <>
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-4">
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">You&apos;re sending</p>
              <p className="mt-1 text-4xl font-display font-bold tabular">£{(amt || 0).toFixed(2)}</p>
              <div className="mt-5 space-y-3 text-sm">
                <Row k="Beneficiary" v={ben.accountName} />
                <Row k="Account number" v={ben.accountNumber} />
                <Row k="Bank name" v={ben.bankName} />
                <Row k="Bank address" v={ben.bankAddress} />
                <Row k="Country" v={ben.country} />
                <Row k="Swift code" v={ben.swiftCode} />
                <Row k="IBAN" v={ben.ibanNumber} />
                <Row k="Fee" v="Free" />
                <Row k="Note" v={note || "—"} />
                <div className="border-t border-border pt-3">
                  <Row k="Balance after" v={gbp(user.balance - amt)} bold />
                </div>
              </div>
            </div>
            <Strip tone="info" icon={Info} text="Funds arrive immediately to registered accounts." />
            <Strip tone="warn" icon={AlertTriangle} text="Transfers cannot be reversed once confirmed." />
          </div>
          <StickyFooter>
            <button onClick={() => setStep("form")}
              className="flex-1 h-12 rounded-full bg-secondary text-foreground font-semibold text-sm" style={{ touchAction: "manipulation" }}>Back</button>
            <button onClick={() => setPinOpen(true)} disabled={confirming}
              className="flex-[2] h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60" style={{ touchAction: "manipulation" }}>
              {confirming ? "Confirming…" : "Confirm"}
            </button>
          </StickyFooter>
        </>
      )}

      {step === "done" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="mt-5 text-2xl font-display font-bold">Transfer sent</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{gbp(amt)} to {ben.accountName}</p>
            <div className="mt-6 w-full bg-card rounded-2xl border border-border p-5 text-left text-sm space-y-3">
              <Row k="Account number" v={ben.accountNumber} />
              <Row k="Bank name" v={ben.bankName} />
              <Row k="Swift code" v={ben.swiftCode} />
              <Row k="Note" v={note || "—"} />
              <Row k="Status" v="Completed" />
            </div>
          </div>
          <StickyFooter>
            <button onClick={() => navigate({ to: "/dashboard" })}
              className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm" style={{ touchAction: "manipulation" }}>Done</button>
          </StickyFooter>
        </>
      )}

      <ContactSupportModal open={supportOpen} onOpenChange={(o) => { setSupportOpen(o); if (!o && step !== "done") navigate({ to: "/dashboard" }); }} context={supportCtx} />

      <PinModal open={pinOpen} onClose={() => setPinOpen(false)}
        user={{ name: user.name, email: user.email, avatar: user.avatar }}
        expectedPin={user.pin}
        onSuccess={() => { setPinOpen(false); handleConfirm(); }}
        title="Confirm transfer" />
    </PhoneFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className={`tabular text-right break-words ${bold ? "font-semibold text-foreground" : "text-foreground"}`}>{v || "—"}</span>
    </div>
  );
}
function Strip({ tone, icon: Icon, text }: { tone: "info" | "warn"; icon: typeof Info; text: string }) {
  const cls = tone === "info" ? "bg-sky-50 text-sky-900" : "bg-amber-50 text-amber-900";
  return (
    <div className={`flex items-start gap-2.5 rounded-xl p-3 ${cls}`}>
      <Icon className="size-4 mt-0.5 shrink-0" /><p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
}
function StickyFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 bg-card border-t border-border px-5 pt-3 flex gap-2"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>{children}</div>
  );
}
