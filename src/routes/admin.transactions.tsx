import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import { selectAllTransactions, store, useStore, type TxStatus, type AppTransaction, formatRelative } from "@/lib/store";
import { gbp } from "@/lib/store";
import { TransactionReceiptModal, type ReceiptTx } from "@/components/TransactionReceiptModal";

export const Route = createFileRoute("/admin/transactions")({
  component: AdminTransactionsPage,
});

const STATUSES: (TxStatus | "all")[] = ["all", "pending", "successful", "failed"];

function AdminTransactionsPage() {
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TxStatus | "all">("all");
  const [showDeleted, setShowDeleted] = useState(true);
  const [selected, setSelected] = useState<AppTransaction | null>(null);
  const users = useStore((s) => s.users);
  const all = useStore(selectAllTransactions({ includeDeleted: true }));

  function toReceipt(t: AppTransaction): ReceiptTx {
    const u = users.find((x) => x.id === t.userId);
    return {
      id: t.id, merchant: t.merchant, category: t.category, amount: t.amount,
      date: formatRelative(t.createdAt), status: t.status, kind: t.kind,
      beneficiary: t.beneficiary, note: t.note, source: t.source, userName: u?.name ?? "Deleted user",
    };
  }

  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (!showDeleted && t.deleted) return false;
      if (userFilter !== "all" && t.userId !== userFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      return true;
    });
  }, [all, userFilter, statusFilter, showDeleted]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">Full history across all users.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-1">User</label>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
            <option value="all">All users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TxStatus | "all")}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm h-10">
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="size-4" />
          Show deleted
        </label>
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {all.length} transactions</div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Merchant</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">When</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions match these filters.</td></tr>
              )}
              {filtered.map((t) => {
                const user = users.find((u) => u.id === t.userId);
                const positive = t.amount > 0;
                return (
                  <tr key={t.id} onClick={() => setSelected(t)}
                    className={`cursor-pointer hover:bg-secondary/40 ${t.deleted ? "opacity-50 line-through" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{user?.name ?? "Deleted user"}</p>
                      <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{t.merchant}</p>
                      {t.note && <p className="text-[11px] text-muted-foreground">{t.note}</p>}
                    </td>
                    <td className={`px-4 py-3 text-right tabular font-semibold ${positive ? "text-emerald-600" : "text-foreground"}`}>
                      {positive ? "+" : ""}{gbp(t.amount)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select value={t.status}
                        onChange={(e) => store.setTransactionStatus(t.id, e.target.value as TxStatus)}
                        disabled={t.deleted}
                        className={`h-8 rounded-md border border-input bg-card px-2 text-xs font-medium ${
                          t.status === "pending" ? "text-amber-700" : t.status === "successful" ? "text-emerald-700" : "text-rose-700"
                        }`}>
                        <option value="pending">pending</option>
                        <option value="successful">successful</option>
                        <option value="failed">failed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelative(t.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {t.deleted ? (
                        <button onClick={() => store.restoreTransaction(t.id)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" aria-label="Restore">
                          <RotateCcw className="size-4" />
                        </button>
                      ) : (
                        <button onClick={() => store.softDeleteTransaction(t.id)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" aria-label="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionReceiptModal open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        tx={selected ? toReceipt(selected) : null} />
    </div>
  );
}
