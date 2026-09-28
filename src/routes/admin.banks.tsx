import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore, gbp } from "@/lib/store";

export const Route = createFileRoute("/admin/banks")({
  component: AdminBanksPage,
});

// Bank accounts view — shows registered beneficiary details per admin-created user
function AdminBanksPage() {
  const users = useStore((s) => s.users);
  const [open, setOpen] = useState(false);

  const accounts = users.filter((u) => u.beneficiary?.accountNumber);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Bank accounts</h1>
          <p className="text-sm text-muted-foreground">All registered beneficiary accounts in the system.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="size-4" /> Add account note</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((u) => {
          const b = u.beneficiary;
          return (
            <div key={u.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <span className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Landmark className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{b.bankName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{u.name}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Row label="Account name" value={b.accountName} />
                <Row label="Account number" value={b.accountNumber} />
                <Row label="Bank address" value={b.bankAddress} />
                <Row label="Country" value={b.country} />
                <Row label="Swift code" value={b.swiftCode} />
                <Row label="IBAN" value={b.ibanNumber} />
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="font-semibold tabular text-sm">{gbp(u.balance)}</span>
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <div className="col-span-full bg-card border border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-muted-foreground">No bank accounts registered. Create a user with beneficiary details first.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Bank accounts are auto-managed</DialogTitle>
            <DialogDescription>
              Bank accounts are created automatically when you add a user with beneficiary details.
              Go to the Users page to create a new user account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <span className="font-mono font-medium text-right break-all">{value}</span>
    </div>
  );
}
