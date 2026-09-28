import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { Phone, Mail, MessageCircle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <PhoneFrame>
      <AppHeader title="Support" back="/dashboard" />
      <main className="flex-1 px-5 pt-5 pb-6 space-y-5">
        <section className="bg-primary text-primary-foreground rounded-2xl p-5">
          <h2 className="text-lg font-display font-semibold">We're here to help</h2>
          <p className="text-sm text-primary-foreground/85 mt-1">
            Reach our team 24/7. Average response under 2 minutes.
          </p>
          <button
            className="mt-4 h-11 px-5 rounded-full bg-white text-primary font-semibold text-sm inline-flex items-center gap-2"
            style={{ touchAction: "manipulation" }}
          >
            <MessageCircle className="size-4" /> Start live chat
          </button>
        </section>

        <section className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          <ContactRow icon={Phone} label="Call us" value="0800 123 4567" />
          <ContactRow icon={Mail} label="Email" value="help@santander.app" />
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3">Popular topics</h3>
          <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {["Report a lost card", "Dispute a transaction", "Update your details", "Close your account"].map((t) => (
              <li key={t}>
                <button className="w-full flex items-center justify-between p-4 text-sm" style={{ touchAction: "manipulation" }}>
                  <span>{t}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </PhoneFrame>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
