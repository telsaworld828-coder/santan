import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users, Receipt, Clock, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { selectAllTransactions, store, useStore, formatRelative, type AppTransaction } from "@/lib/store";
import { gbp } from "@/lib/store";
import { TransactionReceiptModal, type ReceiptTx } from "@/components/TransactionReceiptModal";

function toReceipt(t: AppTransaction, userName?: string): ReceiptTx {
  return {
    id: t.id, merchant: t.merchant, category: t.category, amount: t.amount,
    date: formatRelative(t.createdAt), status: t.status, kind: t.kind,
    beneficiary: t.beneficiary, note: t.note, source: t.source, userName,
  };
}

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const adminBalance = useStore((s) => s.adminBalance);
  const users = useStore((s) => s.users);
  const txs = useStore(selectAllTransactions({ includeDeleted: false }));
  const totalVolume = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pending = txs.filter((t) => t.status === "pending").length;
  const recent = txs.slice(0, 8);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AppTransaction | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleFund(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    store.fundAdmin(n);
    toast.success(`Added ${gbp(n)} to admin balance`);
    setAmount(""); setNote(""); setOpen(false);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Manage user funding, transactions, and bank accounts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Admin balance" value={gbp(adminBalance)} icon={TrendingUp}
          action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="size-3" /> Add funds</button>} />
        <Stat label="Total users" value={users.length.toString()} icon={Users} sub={`${users.filter(u => u.status === "active").length} active`} />
        <Stat label="Total volume" value={gbp(totalVolume)} icon={Receipt} sub={`${txs.length} transactions`} />
        <Stat label="Pending" value={pending.toString()} icon={Clock} sub="Awaiting status" tone={pending > 0 ? "warn" : "default"} />
      </div>

      <section className="bg-card border border-border rounded-2xl">
        <header className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-semibold">Recent activity</h2>
          <Link to="/admin/transactions" className="text-xs font-medium text-primary hover:underline">View all</Link>
        </header>
        <ul className="divide-y divide-border">
          {recent.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</li>}
          {recent.map((t) => {
            const user = users.find((u) => u.id === t.userId);
            const positive = t.amount > 0;
            return (
              <li key={t.id}>
                <button type="button" onClick={() => setSelected(t)}
                  className="w-full text-left flex items-center gap-3 p-4 hover:bg-secondary/40 transition-colors">
                  <div className={`size-9 rounded-xl grid place-items-center ${positive ? "bg-emerald-50 text-emerald-600" : "bg-secondary text-foreground"}`}>
                    {positive ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.merchant}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.name ?? "Deleted user"} · {formatRelative(t.createdAt)}</p>
                  </div>
                  <StatusPill status={t.status} />
                  <p className={`text-sm font-semibold tabular w-24 text-right ${positive ? "text-emerald-600" : "text-foreground"}`}>
                    {positive ? "+" : ""}{gbp(t.amount)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Add to admin balance</DialogTitle>
            <DialogDescription>Top up the admin float used to fund user accounts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFund} className="space-y-4">
            <div>
              <Label htmlFor="amt" className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
              <div className="mt-1.5 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <Input id="amt" autoFocus inputMode="decimal" value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="pl-7 h-12 text-lg tabular" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label htmlFor="note" className="text-xs uppercase tracking-wide text-muted-foreground">Note (optional)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" placeholder="Treasury top-up" />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Add funds</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TransactionReceiptModal open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        tx={selected ? toReceipt(selected, users.find((u) => u.id === selected.userId)?.name ?? "Deleted user") : null} />
    </div>
  );
}

function Stat({ label, value, icon: Icon, sub, action, tone = "default" }: {
  label: string; value: string; icon: typeof Users; sub?: string; action?: React.ReactNode; tone?: "default" | "warn";
}) {
  const toneCls = tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-primary/10 text-primary";
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className={`size-9 rounded-xl grid place-items-center ${toneCls}`}><Icon className="size-4" /></span>
        {action}
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-2xl tabular">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function StatusPill({ status }: { status: "pending" | "successful" | "failed" }) {
  const map = {
    pending: "bg-amber-100 text-amber-800",
    successful: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
  } as const;
  return <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
}
