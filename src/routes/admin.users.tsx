import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Plus, Wallet, Search, Snowflake, Sun, Eye, EyeOff, Camera, Trash2, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { store, useStore, selectUserTransactions, formatRelative, type AppUser, type TxStatus, type Beneficiary } from "@/lib/store";
import { gbp } from "@/lib/store";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function StatusBadge({ status }: { status: AppUser["status"] }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
      {status === "frozen" ? "blocked" : status}
    </span>
  );
}

function AdminUsersPage() {
  const users = useStore((s) => s.users);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppUser["status"]>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [fundFor, setFundFor] = useState<AppUser | null>(null);
  const [detailFor, setDetailFor] = useState<AppUser | null>(null);
  const [deleteFor, setDeleteFor] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, query, statusFilter]);

  const detail = detailFor ? users.find((u) => u.id === detailFor.id) ?? null : null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {users.length} accounts shown.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5"><Plus className="size-4" /> Add user</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="frozen">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1.6fr_0.9fr_0.7fr_auto] px-5 py-3 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
          <div>User</div><div>Email</div><div className="text-right">Balance</div><div>Status</div><div className="w-24" />
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((u) => (
            <li key={u.id} onClick={() => setDetailFor(u)}
              className="grid md:grid-cols-[1.4fr_1.6fr_0.9fr_0.7fr_auto] grid-cols-1 gap-3 items-center px-5 py-4 cursor-pointer hover:bg-secondary/40 transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold overflow-hidden">
                  {u.avatar
                    ? <img src={u.avatar} alt={u.name} className="size-full object-cover" />
                    : u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">Joined {formatRelative(u.createdAt)}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground truncate">{u.email}</div>
              <div className="text-sm font-semibold tabular md:text-right">{gbp(u.balance)}</div>
              <div><StatusBadge status={u.status} /></div>
              <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => setFundFor(u)} className="gap-1.5">
                  <Wallet className="size-3.5" /> Fund
                </Button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">No users match these filters.</li>
          )}
        </ul>
      </div>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} />
      <FundUserDialog user={fundFor} onClose={() => setFundFor(null)} />
      <UserDetailSheet user={detail} onClose={() => setDetailFor(null)}
        onRequestDelete={(u) => { setDetailFor(null); setDeleteFor(u); }} />

      <AlertDialog open={!!deleteFor} onOpenChange={(o) => { if (!o) setDeleteFor(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete {deleteFor?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account and login access. Their past transactions
              will remain on record but will display as &quot;Deleted user&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteFor) return;
                const name = deleteFor.name;
                const result = await store.deleteUser(deleteFor.id);
                if (result.ok) {
                  toast.success(`${name} deleted`);
                } else {
                  toast.error(`Could not delete ${name}: ${result.error ?? "unknown error"}`);
                }
                setDeleteFor(null);
              }}>
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bal, setBal] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [ben, setBen] = useState<Beneficiary>({
    accountName: "", accountNumber: "", bankName: "", bankAddress: "", country: "", swiftCode: "", ibanNumber: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof Beneficiary>(key: K, value: string) {
    setBen((b) => ({ ...b, [key]: value }));
  }

  function reset() {
    setName(""); setEmail(""); setBal(""); setPassword(""); setShowPw(false);
    setPin(""); setAvatar(undefined);
    setBen({ accountName: "", accountNumber: "", bankName: "", bankAddress: "", country: "", swiftCode: "", ibanNumber: "" });
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2MB"); return; }
    const r = new FileReader();
    r.onload = () => setAvatar(typeof r.result === "string" ? r.result : undefined);
    r.readAsDataURL(f);
  }

  const benComplete =
    ben.accountName.trim() && ben.accountNumber.trim() && ben.bankName.trim() &&
    ben.bankAddress.trim() && ben.country.trim() && ben.swiftCode.trim() && ben.ibanNumber.trim();
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && pin.length === 4 && !!benComplete;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const startingBalance = parseFloat(bal) || 0;
    const u = store.addUser({ name, email, password, pin, startingBalance, avatar, beneficiary: ben });
    toast.success(`Created account for ${u.name}`);
    reset(); onOpenChange(false);
  }

  const initials = name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Create user</DialogTitle>
          <DialogDescription>Set up a new Santander account with login credentials and beneficiary details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative size-16 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold overflow-hidden ring-2 ring-border hover:ring-primary transition"
              aria-label="Choose profile picture">
              {avatar ? <img src={avatar} alt="" className="absolute inset-0 size-full object-cover" /> : <span>{initials}</span>}
              <span className="absolute bottom-0 inset-x-0 bg-black/45 text-white py-0.5 grid place-items-center"><Camera className="size-3" /></span>
            </button>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Profile picture</p>
              <p>Optional. PNG or JPG, max 2MB.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Full name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@santander.app" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Password</Label>
            <div className="mt-1.5 relative">
              <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">4-digit PIN</Label>
            <Input type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••" className="mt-1.5 tracking-[0.5em] text-center" />
            <p className="mt-1 text-[11px] text-muted-foreground">Used as 2FA at login and to confirm transfers.</p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground">Beneficiary details — required so other users can transfer to this account.</p>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Beneficiary account name</Label>
              <Input value={ben.accountName} onChange={(e) => setField("accountName", e.target.value)} placeholder="Full legal name" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Beneficiary account number</Label>
              <Input value={ben.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} placeholder="e.g. 88421097" className="mt-1.5 tabular" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Bank name</Label>
              <Input value={ben.bankName} onChange={(e) => setField("bankName", e.target.value)} placeholder="e.g. Santander UK" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Bank address</Label>
              <Input value={ben.bankAddress} onChange={(e) => setField("bankAddress", e.target.value)} placeholder="Branch address" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Country</Label>
              <Input value={ben.country} onChange={(e) => setField("country", e.target.value)} placeholder="e.g. United Kingdom" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Swift code</Label>
              <Input value={ben.swiftCode} onChange={(e) => setField("swiftCode", e.target.value.toUpperCase())} placeholder="e.g. ABBYGB2L" className="mt-1.5 tabular uppercase" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">IBAN number</Label>
              <Input value={ben.ibanNumber} onChange={(e) => setField("ibanNumber", e.target.value.toUpperCase())} placeholder="e.g. GB29 ABBY 0429 1588 4210 97" className="mt-1.5 tabular uppercase" />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Opening balance (optional)</Label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <Input inputMode="decimal" value={bal} onChange={(e) => setBal(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" className="pl-7 tabular" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>Create user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FundUserDialog({ user, onClose }: { user: AppUser | null; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TxStatus>("successful");
  const [fromAdmin, setFromAdmin] = useState(true);
  function reset() { setAmount(""); setNote(""); setStatus("successful"); setFromAdmin(true); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    store.fundUser({ userId: user.id, amount: n, note, fromAdmin, status });
    toast.success(`${status === "successful" ? "Funded" : "Queued"} ${gbp(n)} to ${user.name}`);
    reset(); onClose();
  }
  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Fund {user?.name}</DialogTitle>
          <DialogDescription>Credit this user&apos;s Santander balance.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <Input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" className="pl-7 h-12 text-lg tabular" />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / reference" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["pending", "successful", "failed"] as TxStatus[]).map((s) => (
              <button type="button" key={s} onClick={() => setStatus(s)}
                className={`h-9 rounded-lg text-xs font-medium border transition ${status === s ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={fromAdmin} onChange={(e) => setFromAdmin(e.target.checked)} className="size-4 rounded border-input" />
            Debit from admin balance
          </label>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Fund user</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailSheet({ user, onClose, onRequestDelete }: {
  user: AppUser | null; onClose: () => void; onRequestDelete: (u: AppUser) => void;
}) {
  // Always call useStore unconditionally — empty string userId returns [] safely
  const txns = useStore(selectUserTransactions(user?.id ?? ""));
  if (!user) return null;
  const recent = txns.slice(0, 5);
  return (
    <Sheet open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold overflow-hidden">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="size-full object-cover" /> : user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <SheetTitle className="font-display text-left text-lg truncate">{user.name}</SheetTitle>
              <SheetDescription className="text-left truncate">{user.email}</SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-3">
            <StatusBadge status={user.status} />
            <span className="text-[11px] text-muted-foreground">Balance {gbp(user.balance)}</span>
          </div>
        </SheetHeader>
        <div className="p-6 space-y-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account controls</h3>
            <div className="flex flex-wrap gap-2">
              {user.status === "active" ? (
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { store.setUserStatus(user.id, "frozen"); toast.success(`${user.name} blocked`); }}>
                  <Snowflake className="size-3.5" /> Block account
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { store.setUserStatus(user.id, "active"); toast.success(`${user.name} unblocked`); }}>
                  <Sun className="size-3.5" /> Unblock
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => onRequestDelete(user)}>
                <Trash2 className="size-3.5" /> Delete account
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beneficiary details</h3>
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Landmark className="size-3.5" />
                </span>
                <span className="font-medium">{user.beneficiary.bankName}</span>
              </div>
              <DetailRow label="Account name" value={user.beneficiary.accountName} />
              <DetailRow label="Account number" value={user.beneficiary.accountNumber} />
              <DetailRow label="Bank address" value={user.beneficiary.bankAddress} />
              <DetailRow label="Country" value={user.beneficiary.country} />
              <DetailRow label="Swift code" value={user.beneficiary.swiftCode} />
              <DetailRow label="IBAN" value={user.beneficiary.ibanNumber} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent transactions</h3>
            {recent.length === 0 ? <p className="text-sm text-muted-foreground">No transactions yet.</p> : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{t.merchant}</p>
                      <p className="text-[11px] text-muted-foreground">{formatRelative(t.createdAt)} · {t.status}</p>
                    </div>
                    <span className={`tabular font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-foreground"}`}>
                      {t.amount >= 0 ? "+" : ""}{gbp(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}
