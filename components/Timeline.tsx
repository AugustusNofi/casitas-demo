import type { TimelineEvent } from "@/lib/types";
import { formatMoney } from "@/lib/pricing";

const SOURCE_LABEL: Record<TimelineEvent["source"], string> = {
  guest: "Huésped",
  admin: "Back office",
  system: "Sistema",
  nuvei_dmn: "Nuvei (DMN)",
};

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-700">Sin eventos todavía.</p>;
  }

  return (
    <ol className="space-y-4 border-l-2 border-sand-200 pl-4">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-500" />
          <p className="text-sm font-semibold text-ink-900">{e.label}</p>
          {e.detail && <p className="text-xs text-ink-700">{e.detail}</p>}
          <p className="mt-0.5 text-xs text-ink-700">
            {new Date(e.createdAt).toLocaleString("es-ES")} · {SOURCE_LABEL[e.source]}
            {typeof e.amount === "number" && e.currency && (
              <> · {formatMoney(e.amount, e.currency)}</>
            )}
            {e.transactionId && <> · Txn: {e.transactionId}</>}
          </p>
        </li>
      ))}
    </ol>
  );
}
