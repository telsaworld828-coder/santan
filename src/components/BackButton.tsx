import { useNavigate, useRouter, useCanGoBack } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ComponentProps } from "react";

type BackButtonProps = {
  /** Route to use when there's no prior history (deep link, fresh tab, etc.). */
  fallback?: string;
  /** Visual variant: header (dark on light) or onPrimary (light on primary bg). */
  variant?: "header" | "onPrimary";
  label?: string;
  className?: string;
} & Omit<ComponentProps<"button">, "onClick" | "aria-label">;

/**
 * Safe in-app back control.
 *
 * Uses TanStack Router history when available, falls back to a known route
 * when the user landed directly on this screen (browser back stack empty).
 */
export function BackButton({
  fallback = "/dashboard",
  variant = "header",
  label = "Go back",
  className,
  ...rest
}: BackButtonProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const base =
    "size-10 grid place-items-center rounded-full active:scale-95 transition";
  const skin =
    variant === "onPrimary"
      ? "bg-white/15 text-primary-foreground hover:bg-white/25"
      : "text-foreground hover:bg-secondary active:bg-secondary/80";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (canGoBack) {
          router.history.back();
        } else {
          navigate({ to: fallback, replace: true });
        }
      }}
      className={[base, skin, className].filter(Boolean).join(" ")}
      style={{ touchAction: "manipulation" }}
      {...rest}
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}
