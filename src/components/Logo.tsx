import mark from "@/assets/wordsnap-mark.png";
import { cn } from "@/lib/utils";

/** Brand mark. `size` is the icon edge in px. */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src={mark}
      alt="WordSnap AI logo"
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Wordmark({
  size = 32,
  tagline = false,
  className,
}: {
  size?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo size={size} />
      <div className="leading-tight">
        <span className="text-lg font-black tracking-tight">
          Word<span className="gradient-text">Snap</span> AI
        </span>
        {tagline && (
          <p className="text-[11px] tracking-wide text-ink/50">Understand anything instantly.</p>
        )}
      </div>
    </div>
  );
}
