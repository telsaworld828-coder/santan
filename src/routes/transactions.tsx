import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { useStore, selectUserTransactions, type AppTransaction } from "@/lib/store";
import { gbp } from "@/lib/store";
import { Coffee, Train, Music, ShoppingBag, ArrowDownLeft, User, Wifi } from "lucide-react";
import { TransactionReceiptModal, type ReceiptTx } from "@/components/TransactionReceiptModal";
import { getClientSession, isClientAuthed } from "@/lib/auth";

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
});

const tabs = ["All", "Sent", "Received", "Pending"] as const;
type Tab = typeof tabs[number];

const iconMap: Record<string, typeof Coffee> = {
  food: Coffee, transit: Train, subs: Music, income: ArrowDownLeft,
  transfer: User, bills: Wifi, shop: ShoppingBag,
};

function TransactionsPage() {
  const navigate = useNavigate();
  const session = getClientSession();
  const userId = session?.userId ?? "";
  const txs = useStore(selectUserTransactions(userId));
  const [tab, setTab] = useState<Tab>("All");
  const [selected, setSelected] = useState<AppTransaction | null>(null);

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: "/" });
  }, [navigate]);

  function toReceipt(t: AppTransaction): ReceiptTx {
    return {
      id: t.id, merchant: t.merchant, category: t.category, amount: t.amount,
      date: new Date(t.createdAt).toLocaleString(),
      status: t.status, kind: t.kind, beneficiary: t.beneficiary, note: t.note,
    };
  }

  const filtered = txs.filter((t) => {
    if (tab === "All") return true;
    if (tab === "Sent") return t.kind === "debit";
    if (tab === "Received") return t.kind === "credit";
    if (tab === "Pending") return t.status === "pending";
    return true;
  });

  return (
    <PhoneFrame>
      <AppHeader title="Activity" back="/dashboard" />
      <div className="px-5 pt-3 border-b border-border bg-card">
        <ul className="flex gap-5 text-sm">
          {tabs.map((t) => (
            <li key={t}>
              <button onClick={() => setTab(t)}
                className={`relative pb-3 font-medium ${tab === t ? "text-primary" : "text-muted-foreground"}`}
                style={{ touchAction: "manipulation" }}>
                {t}
                {tab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <main className="flex-1 px-5 py-4">
        <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {filtered.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">No transactions here.</li>
          )}
          {filtered.map((t) => {
            const Icon = iconMap[t.category] ?? ShoppingBag;
            const positive = t.amount > 0;
            return (
              <li key={t.id}>
                <button type="button" onClick={() => setSelected(t)}
                  className="w-full text-left flex items-center gap-3 p-4 hover:bg-secondary/40 transition-colors">
                  <div className={`size-10 rounded-xl grid place-items-center ${positive ? "bg-emerald-50 text-emerald-600" : "bg-secondary text-foreground"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.merchant}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular ${positive ? "text-emerald-600" : "text-foreground"}`}>
                      {positive ? "+" : ""}{gbp(t.amount)}
                    </p>
                    {t.status === "pending" && (
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending</span>
                    )}
                    {t.status === "failed" && (
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Failed</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <TransactionReceiptModal open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        tx={selected ? toReceipt(selected) : null} />
    </PhoneFrame>
  );
}
