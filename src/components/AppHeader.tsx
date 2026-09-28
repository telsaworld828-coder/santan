import { BackButton } from "@/components/BackButton";
import { CadenceMark } from "@/components/CadenceMark";

export function AppHeader({ title, back }: { title: string; back?: string }) {
  return (
    <header
      className="sticky top-0 z-10 bg-card border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 px-2 flex items-center gap-1">
        {back ? (
          <BackButton fallback={back} className="-ml-1 size-11" />
        ) : (
          <div className="w-2" />
        )}
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}

export function CadenceWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      <CadenceMark size={24} className="rounded-md" />
      Santander
    </span>
  );
}

