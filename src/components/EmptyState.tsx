import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-premium mt-4 rounded-3xl px-6 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink/5 text-ink/60">
        {icon ?? <Search className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-[34ch] text-sm text-ink/55">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function LocalOnlyNotice({ label }: { label: string }) {
  return (
    <p className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200/90">
      {label} is stored on this device for now and will sync once your account backend is connected.
    </p>
  );
}
