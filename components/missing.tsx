import { cn } from "@/lib/cn";

export function Missing({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <span className="group relative inline-flex max-w-full">
      <span className="num text-mute" aria-hidden>
        —
      </span>
      <span className="sr-only">not reported by source</span>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full z-20 mb-1 w-max border border-line bg-surface px-2 py-1 text-[11px] font-sans normal-case tracking-normal text-dim opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
        )}
      >
        not reported by source
      </span>
    </span>
  );
}
