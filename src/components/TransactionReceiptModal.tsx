import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Train, Music, ShoppingBag, ArrowDownLeft, User, Wifi, Receipt, Check, X } from "lucide-react";
import { gbp, type Beneficiary } from "@/lib/store";

const iconMap: Record<string, typeof Coffee> = {
  food: Coffee,
  transit: Train,
  subs: Music,
  income: ArrowDownLeft,
  transfer: User,
  bills: Wifi,
  shop: ShoppingBag,
};

export type ReceiptTx = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  status?: "pending" | "successful" | "failed";
  kind?: "credit" | "debit";
  note?: string;
  userName?: string;
  source?: "admin" | "user" | "system";
  beneficiary?: Beneficiary;
};

const statusCls: Record<NonNullable<ReceiptTx["status"]>, string> = {
  pending: "bg-amber-100 text-amber-800",
  successful: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

export function TransactionReceiptModal({
  open,
  onOpenChange,
  tx,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: ReceiptTx | null;
}) {
  if (!tx) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-2xl" />
      </Dialog>
    );
  }

  const Icon = iconMap[tx.category] ?? Receipt;
  const positive = tx.amount > 0;
  const kind = tx.kind ?? (positive ? "credit" : "debit");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Transaction receipt</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center pt-2">
          <div
            className={`size-14 rounded-2xl grid place-items-center mb-3 ${
              positive ? "bg-emerald-50 text-emerald-600" : "bg-secondary text-foreground"
            }`}
          >
            <Icon className="size-6" />
          </div>
          <p
            className={`font-display font-bold text-3xl tabular ${
              positive ? "text-emerald-600" : "text-foreground"
            }`}
          >
            {positive ? "+" : ""}
            {gbp(tx.amount)}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{tx.merchant}</p>
          {tx.status && (
            <span
              className={`mt-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusCls[tx.status]}`}
            >
              {tx.status}
            </span>
          )}
        </div>

        <div className="my-2 border-t border-dashed border-border" />

        <StatusTimeline status={tx.status ?? "pending"} />

        <div className="my-2 border-t border-dashed border-border" />

        <dl className="space-y-2 text-sm">
          <Row label="Date" value={tx.date} />
          <Row label="Category" value={tx.category} className="capitalize" />
          <Row label="Type" value={kind === "credit" ? "Credit" : "Debit"} />
          {tx.beneficiary && (
            <>
              <Row label="Beneficiary" value={tx.beneficiary.accountName} />
              <Row label="Acc. number" value={tx.beneficiary.accountNumber} mono />
              <Row label="Bank" value={tx.beneficiary.bankName} />
              <Row label="Bank address" value={tx.beneficiary.bankAddress} />
              <Row label="Country" value={tx.beneficiary.country} />
              <Row label="Swift code" value={tx.beneficiary.swiftCode} mono />
              <Row label="IBAN" value={tx.beneficiary.ibanNumber} mono />
            </>
          )}
          {tx.userName && <Row label="User" value={tx.userName} />}
          {tx.source && <Row label="Source" value={tx.source} className="capitalize" />}
          {tx.note && <Row label="Note" value={tx.note} />}
          <Row label="Reference" value={tx.id} mono />
        </dl>

        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusTimeline({ status }: { status: ReceiptTx["status"] }) {
  const s = status ?? "pending";
  const steps = [
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed" },
  ] as const;

  const failed = s === "failed";
  const stepIndex = failed ? 0 : s === "pending" ? 0 : s === "successful" ? 2 : 1;

  return (
    <div className="flex items-start gap-2 text-xs">
      {steps.map((step, i) => {
        const done = i <= stepIndex && !failed;
        const isFailed = failed && i === 0;
        const active = i === stepIndex || isFailed;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`size-7 rounded-full grid place-items-center border-2 transition-colors ${
                isFailed
                  ? "bg-rose-50 border-rose-400 text-rose-600"
                  : done
                    ? "bg-emerald-50 border-emerald-400 text-emerald-600"
                    : active
                      ? "bg-amber-50 border-amber-400 text-amber-600"
                      : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {isFailed ? <X className="size-3.5" /> : done || active ? <Check className="size-3.5" /> : null}
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                isFailed ? "text-rose-600" : done ? "text-emerald-600" : active ? "text-amber-600" : "text-muted-foreground"
              }`}
            >
              {isFailed ? "Failed" : step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Row({
  label,
  value,
  className = "",
  mono = false,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right font-medium text-foreground max-w-[60%] break-words ${mono ? "font-mono text-xs" : ""} ${className}`}
      >
        {value}
      </dd>
    </div>
  );
}
