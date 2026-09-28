import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, LifeBuoy, Mail, MessageCircle, ShieldAlert } from "lucide-react";

export type SupportReason = "failed_transaction" | "failed_action" | "frozen_account" | "general";

export type SupportContext = {
  reason?: SupportReason;
  reference?: string;
  summary?: string;
};

const WHATSAPP_NUMBER = "447746538486";
const SUPPORT_EMAIL = "Santanderukbank53@gmail.com";

const TITLES: Record<SupportReason, string> = {
  failed_transaction: "We couldn't complete this transaction",
  failed_action: "Something went wrong",
  frozen_account: "Your account has been blocked",
  general: "Contact support",
};

const DESCRIPTIONS: Record<SupportReason, string> = {
  failed_transaction: "The recipient details don't match any registered account. Reach out and we'll help resolve this.",
  failed_action: "Send us a message on WhatsApp or email — we usually reply in minutes.",
  frozen_account: "Your Santander account has been blocked for security reasons. Contact Support to rectify this issue.",
  general: "Our team is available 24/7 — WhatsApp or email us anytime.",
};

function buildBody(context?: SupportContext) {
  const lines: string[] = ["Hi Santander team,", ""];
  if (context?.summary) lines.push(`Issue: ${context.summary}`);
  if (context?.reference) lines.push(`Reference: ${context.reference}`);
  lines.push("", "Details:", "");
  return lines.join("\n");
}

function buildSubject(context?: SupportContext) {
  if (context?.reason === "frozen_account") return "Blocked account — request to unblock";
  if (context?.summary) return `Help with: ${context.summary}`;
  if (context?.reason === "failed_transaction") return "Failed transaction";
  if (context?.reason === "failed_action") return "Action didn't go through";
  return "Santander support request";
}

export function ContactSupportModal({ open, onOpenChange, context }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: SupportContext;
}) {
  const reason: SupportReason = context?.reason ?? "general";
  const isFailure = reason !== "general";
  const isFrozen = reason === "frozen_account";

  const subject = buildSubject(context);
  const body = buildBody(context);
  const waText = encodeURIComponent(`${subject}\n\n${body}`);
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-2xl">
        <DialogHeader>
          <div className={`size-10 rounded-xl grid place-items-center mb-1 ${
            isFrozen ? "bg-rose-100 text-rose-600" : isFailure ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}>
            {isFrozen ? <ShieldAlert className="size-5" /> : isFailure ? <AlertTriangle className="size-5" /> : <LifeBuoy className="size-5" />}
          </div>
          <DialogTitle className="font-display">{TITLES[reason]}</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[reason]}</DialogDescription>
        </DialogHeader>

        {(context?.summary || context?.reference) && (
          <div className="rounded-xl bg-secondary border border-border p-3 text-sm space-y-1">
            {context?.summary && <p className="font-medium text-foreground truncate">{context.summary}</p>}
            {context?.reference && <p className="text-[11px] uppercase tracking-wide text-muted-foreground tabular">Ref: {context.reference}</p>}
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-secondary transition">
            <div className="size-10 rounded-xl bg-emerald-500 text-white grid place-items-center">
              <MessageCircle className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">WhatsApp us</p>
              <p className="text-xs text-muted-foreground">+44 7746 538486 · replies in minutes</p>
            </div>
          </a>
          <a href={mailHref} onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-secondary transition">
            <div className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Mail className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Email us</p>
              <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
