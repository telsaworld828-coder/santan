import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { CadenceWordmark } from "@/components/AppHeader";
import { BackButton } from "@/components/BackButton";
import { gbp, useStore, selectUser, selectUserTransactions, type AppTransaction } from "@/lib/store";
import { ArrowUpRight, ArrowDownLeft, Receipt, LifeBuoy, Eye, EyeOff, Bell, ShoppingBag, Coffee, Train, Music, User, Wifi, Plus, CreditCard, LogOut, ShieldAlert, Landmark } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContactSupportModal } from "@/components/ContactSupportModal";
import { TransactionReceiptModal, type ReceiptTx } from "@/components/TransactionReceiptModal";
import { getClientSession, clearClientSession, isClientAuthed } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const categoryIcon: Record<string, typeof Coffee> = {
  food: Coffee, transit: Train, subs: Music, income: ArrowDownLeft,
  transfer: User, bills: Wifi, shop: ShoppingBag,
};

const PRESETS = [10, 25, 50, 100, 250];

function Dashboard() {
  const navigate = useNavigate();
  const session = getClientSession();
  const userId = session?.userId ?? "";
  const user = useStore(selectUser(userId));
  const txs = useStore(selectUserTransactions(userId));
  const [supportOpen, setSupportOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [selected, setSelected] = useState<AppTransaction | null>(null);

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: "/" });
  }, [navigate]);

  if (!user) return null;

  const mask = (v: string) => v.replace(/[^\s-]/g, "•");

  function toReceipt(t: AppTransaction): ReceiptTx {
    return {
      id: t.id, merchant: t.merchant, category: t.category, amount: t.amount,
      date: new Date(t.createdAt).toLocaleString(),
      status: t.status, kind: t.kind, beneficiary: t.beneficiary, note: t.note,
    };
  }

  const frozen = user.status === "frozen";
  const initials = user.name.split(" ").map((s) => s[0]).join("").toUpperCase();

  return (
    <PhoneFrame>
      <header className="bg-primary text-primary-foreground px-5 pb-8 rounded-b-[2rem]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <BackButton variant="onPrimary" fallback="/" className="-ml-1 size-9" />
            <CadenceWordmark className="text-lg ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <button className="size-9 rounded-full bg-white/15 grid place-items-center" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="size-9 rounded-full bg-white/20 grid place-items-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-white/60 overflow-hidden"
                aria-label="Account menu">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                  : initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground tabular">{user.beneficiary.accountNumber}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSupportOpen(true)}>
                  <LifeBuoy className="size-4" />Contact support
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { clearClientSession(); toast.success("Signed out"); navigate({ to: "/" }); }}
                  className="text-destructive focus:text-destructive">
                  <LogOut className="size-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-primary-foreground/80 text-sm">Good morning,</p>
          <p className="text-xl font-display font-semibold">{user.name.split(" ")[0]}</p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-6 -mt-6">
        {/* Blocked account banner */}
        {frozen && (
          <div className="mb-3 mt-0 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <ShieldAlert className="size-5 text-rose-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-700">Account blocked</p>
              <p className="text-xs text-rose-600">Your Santander account has been blocked for security reasons. Contact Support to rectify this issue.</p>
            </div>
          </div>
        )}

        {/* Balance card */}
        <section className="bg-card rounded-2xl shadow-card border border-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Landmark className="size-3.5" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground truncate max-w-[160px]">
                {user.beneficiary.bankName}
              </span>
            </div>
            <button type="button" onClick={() => setHidden((h) => !h)}
              className="text-muted-foreground hover:text-foreground p-1 -m-1 rounded-md"
              aria-label={hidden ? "Show balance" : "Hide balance"}>
              {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Available balance</p>
          <p className="mt-1 text-4xl font-display font-bold tracking-tight tabular">
            {hidden ? "••••••" : `£${user.balance.toFixed(2)}`}
          </p>

          <button type="button" onClick={() => setSupportOpen(true)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold shadow-card hover:opacity-95 active:scale-[0.99] transition"
            style={{ touchAction: "manipulation" }}>
            <Plus className="size-4" strokeWidth={2.5} />Add money
          </button>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Account number</p>
              <p className="font-medium tabular truncate">{hidden ? mask(user.beneficiary.accountNumber) : user.beneficiary.accountNumber}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Swift code</p>
              <p className="font-medium tabular truncate">{hidden ? mask(user.beneficiary.swiftCode) : user.beneficiary.swiftCode}</p>
            </div>
            <div className="col-span-2 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">IBAN</p>
              <p className="font-medium tabular truncate">{hidden ? mask(user.beneficiary.ibanNumber) : user.beneficiary.ibanNumber}</p>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-5 grid grid-cols-4 gap-2">
          <QuickAction to="/send" icon={ArrowUpRight} label="Send" />
          <QuickAction to="/receive" icon={ArrowDownLeft} label="Receive" />
          <QuickAction to="/cards" icon={CreditCard} label="Cards" />
          <QuickAction to="/transactions" icon={Receipt} label="Activity" />
        </section>

        <Link to="/cards"
          className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-card hover:bg-secondary transition">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <CreditCard className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Cards</p>
            <p className="text-xs text-muted-foreground">Request or manage your ATM cards</p>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground rotate-45" />
        </Link>

        <section className="mt-5 rounded-2xl bg-accent/60 p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <ShoppingBag className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">You&apos;re on track this week</p>
            <p className="text-xs text-muted-foreground">Spending is 12% lower than last week.</p>
          </div>
        </section>

        {/* Recent activity */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display font-semibold">Recent activity</h2>
            <Link to="/transactions" className="text-xs font-medium text-primary">See all</Link>
          </div>
          <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {txs.slice(0, 5).map((t) => {
              const Icon = categoryIcon[t.category] ?? ShoppingBag;
              const positive = t.amount > 0;
              return (
                <li key={t.id}>
                  <button type="button" onClick={() => setSelected(t)}
                    className="w-full flex items-center gap-3 p-3.5 hover:bg-secondary/40 transition-colors text-left">
                    <div className={`size-10 rounded-xl grid place-items-center ${positive ? "bg-emerald-50 text-emerald-600" : "bg-secondary text-foreground"}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.merchant}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                    <p className={`text-sm font-semibold tabular ${positive ? "text-emerald-600" : "text-foreground"}`}>
                      {positive ? "+" : ""}{gbp(t.amount)}
                    </p>
                  </button>
                </li>
              );
            })}
            {txs.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</li>
            )}
          </ul>
        </section>
      </main>


      <TransactionReceiptModal open={!!selected} onOpenChange={(o) => !o && setSelected(null)}
        tx={selected ? toReceipt(selected) : null} />

      <ContactSupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </PhoneFrame>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Coffee; label: string }) {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-border shadow-card hover:bg-secondary transition">
      <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center">
        <Icon className="size-4" />
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
