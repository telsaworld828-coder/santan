import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { useStore, selectUser } from "@/lib/store";
import { Copy, Check, QrCode, Landmark } from "lucide-react";
import { getClientSession, isClientAuthed } from "@/lib/auth";

export const Route = createFileRoute("/receive")({
  component: ReceivePage,
});

function ReceivePage() {
  const navigate = useNavigate();
  const session = getClientSession();
  const userId = session?.userId ?? "";
  const user = useStore(selectUser(userId));

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: "/" });
  }, [navigate]);

  if (!user) return null;

  const b = user.beneficiary;
  const rows: { label: string; value: string }[] = [
    { label: "Beneficiary account name", value: b.accountName },
    { label: "Beneficiary account number", value: b.accountNumber },
    { label: "Bank name", value: b.bankName },
    { label: "Bank address", value: b.bankAddress },
    { label: "Country", value: b.country },
    { label: "Swift code", value: b.swiftCode },
    { label: "IBAN number", value: b.ibanNumber },
  ];

  return (
    <PhoneFrame>
      <AppHeader title="Receive money" back="/dashboard" />
      <main className="flex-1 px-5 pt-5 pb-6 space-y-5">
        <section className="rounded-2xl bg-accent/60 p-5 flex flex-col items-center text-center">
          <div className="size-32 bg-card rounded-2xl border border-border grid place-items-center">
            <QrCode className="size-20 text-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">Scan or share your details to receive a transfer</p>
        </section>

        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
            <span className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center">
              <Landmark className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{b.bankName}</p>
              <p className="text-[11px] text-muted-foreground">Use these details to receive a transfer</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <CopyRow key={row.label} label={row.label} value={row.value || "—"} />
            ))}
          </div>
        </section>
      </main>
    </PhoneFrame>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium tabular break-words">{value}</p>
      </div>
      <button onClick={copy}
        className="size-9 rounded-full bg-secondary text-foreground grid place-items-center shrink-0"
        style={{ touchAction: "manipulation" }} aria-label={`Copy ${label}`}>
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
