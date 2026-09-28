import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Receipt, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { clearAdminSession } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { gbp } from "@/lib/store";

const nav: { to: string; label: string; icon: typeof Users; exact?: boolean }[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/banks", label: "Bank accounts", icon: CreditCard },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const adminBalance = useStore((s) => s.adminBalance);
  const [open, setOpen] = useState(false);

  function logout() {
    clearAdminSession();
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-dvh bg-secondary/40 flex">
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Santander</p>
            <p className="font-display font-bold text-lg leading-tight">Admin</p>
          </div>
          <button className="md:hidden p-1" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to as "/admin"} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
                <Icon className="size-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2.5 rounded-xl bg-secondary">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Admin balance</p>
            <p className="font-display font-bold tabular text-lg">{gbp(adminBalance)}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 md:px-8 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <p className="text-sm text-muted-foreground">Internal documentation console</p>
          </div>
          <div />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
