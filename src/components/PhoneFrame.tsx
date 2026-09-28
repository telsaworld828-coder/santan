import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background shadow-soft relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
