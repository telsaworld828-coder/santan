import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { CadenceWordmark } from "@/components/AppHeader";
import { BackButton } from "@/components/BackButton";
import { useStore, selectUser } from "@/lib/store";
import { getClientSession, isClientAuthed } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Zap,
  Sparkles,
  Gem,
  Loader2,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cards")({
  component: CardsPage,
});

type CardTypeId = "standard" | "virtual" | "gold" | "metal";

type CardType = {
  id: CardTypeId;
  title: string;
  subtitle: string;
  fee: string;
  icon: typeof CreditCard;
};

const CARD_TYPES: CardType[] = [
  {
    id: "standard",
    title: "Standard Debit",
    subtitle: "Everyday spending and ATM withdrawals",
    fee: "Free",
    icon: CreditCard,
  },
  {
    id: "virtual",
    title: "Virtual Card",
    subtitle: "Instant card for online & in-app payments",
    fee: "Free",
    icon: Zap,
  },
  {
    id: "gold",
    title: "Gold Credit",
    subtitle: "Rewards, travel perks and insurance",
    fee: "£8 / month",
    icon: Sparkles,
  },
  {
    id: "metal",
    title: "Metal Platinum",
    subtitle: "Lounge access, cashback and concierge",
    fee: "£18 / month",
    icon: Gem,
  },
];

function CardsPage() {
  const navigate = useNavigate();
  const session = getClientSession();
  const user = useStore(selectUser(session?.userId ?? ""));

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: "/" });
  }, [navigate]);
  const [selected, setSelected] = useState<CardTypeId | null>(null);
  const [open, setOpen] = useState(false);

  const selectedType = CARD_TYPES.find((c) => c.id === selected) ?? null;

  function handleRequest() {
    if (!selectedType) return;
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    toast.success("Card request submitted");
    navigate({ to: "/dashboard" });
  }

  return (
    <PhoneFrame>
      <header
        className="bg-primary text-primary-foreground px-5 pb-8 rounded-b-[2rem]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <BackButton variant="onPrimary" fallback="/dashboard" className="-ml-1 size-9" />
            <CadenceWordmark className="text-lg ml-1" />
          </div>
        </div>
        <div className="mt-6">
          <p className="text-primary-foreground/80 text-sm">Your cards</p>
          <p className="text-xl font-display font-semibold">Manage & request</p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-8 -mt-6 space-y-6">
        {/* Current card visual */}
        <section
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-card"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 60%, #1a1a1a 100%)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70">
                Current card
              </p>
              <p className="mt-1 text-sm font-medium">Cadence Debit</p>
            </div>
            <Wifi className="size-5 rotate-90 text-white/80" />
          </div>

          <p className="mt-8 font-display text-xl tabular tracking-[0.2em]">
            •••• •••• •••• 4421
          </p>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/60">
                Card holder
              </p>
              <p className="text-sm font-medium">{user?.name ?? "Account Holder"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/60">
                Expires
              </p>
              <p className="text-sm font-medium tabular">08 / 29</p>
            </div>
          </div>
        </section>

        {/* Request a new card */}
        <section>
          <h2 className="text-base font-display font-semibold mb-3">
            Request a new card
          </h2>
          <div className="grid gap-2">
            {CARD_TYPES.map((c) => {
              const active = selected === c.id;
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <div
                    className={`size-10 rounded-lg grid place-items-center ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                        {c.fee}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.subtitle}
                    </p>
                  </div>
                  {active && <CheckCircle2 className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Delivery address */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Delivery address
              </p>
              <p className="mt-1 text-sm font-medium">
                12 Kingsway, London WC2B 6LH
              </p>
              <p className="text-xs text-muted-foreground">
                Virtual cards are delivered instantly to your app.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toast("Address editing coming soon")}
            >
              Change
            </Button>
          </div>
        </section>

        <Button
          type="button"
          onClick={handleRequest}
          disabled={!selectedType}
          className="w-full h-12 rounded-xl text-sm font-semibold"
        >
          {selectedType ? `Request ${selectedType.title}` : "Select a card to request"}
        </Button>
      </main>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
        <DialogContent className="max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Card request in progress
            </DialogTitle>
            <DialogDescription>
              We're preparing your{" "}
              <span className="font-medium text-foreground">
                {selectedType?.title}
              </span>
              . You'll get a notification when it's on its way — usually within
              3–5 business days. Virtual cards arrive in minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4">
            <div className="size-14 rounded-full bg-primary/10 grid place-items-center">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Reference: CD-{Date.now().toString().slice(-6)}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleClose} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneFrame>
  );
}
