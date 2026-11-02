"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHead } from "@/components/section-head";
import { cn } from "@/lib/cn";
import { mulberry32, shuffle } from "@/lib/prng";

const DATA = 10;
const PARITY = 20;
const TOTAL = DATA + PARITY;
const MIN = 10;

export function ErasureStrip() {
  const [knocked, setKnocked] = useState<Set<number>>(() => new Set());
  const [hovering, setHovering] = useState(false);
  const cursor = useRef(0);

  const order = useMemo(
    () => shuffle(Array.from({ length: TOTAL }, (_, index) => index), mulberry32(0x7530)),
    [],
  );

  useEffect(() => {
    if (!hovering) return;
    const id = window.setInterval(() => {
      setKnocked((current) => {
        if (current.size >= TOTAL - MIN + 1) return current;
        const next = new Set(current);
        while (cursor.current < order.length) {
          const shard = order[cursor.current];
          cursor.current += 1;
          if (shard == null || next.has(shard)) continue;
          next.add(shard);
          break;
        }
        return next;
      });
    }, 220);
    return () => window.clearInterval(id);
  }, [hovering, order]);

  const remaining = TOTAL - knocked.size;
  const canRecover = remaining >= MIN;

  return (
    <section data-section="erasure" aria-label="Erasure coding explainer">
      <SectionHead
        title="Erasure coding"
        aside={
          <span className="label border border-line px-1.5 py-1 text-mute">
            Protocol · not live data
          </span>
        }
      />
      <div className="bg-recess px-4 py-5 md:px-6">
        <p className="max-w-3xl text-[13px] leading-6 text-dim">
          Any <span className="num text-ink">10</span> of{" "}
          <span className="num text-ink">30</span> shards rebuild a file —{" "}
          <span className="num text-ink">10</span> data plus{" "}
          <span className="num text-ink">20</span> parity. Hover the strip to knock out shards
          at random and watch recovery hold until fewer than{" "}
          <span className="num text-ink">10</span> remain.
        </p>

        <div
          className="mt-4"
          onMouseEnter={() => {
            cursor.current = 0;
            setHovering(true);
            setKnocked(new Set());
          }}
          onMouseLeave={() => {
            setHovering(false);
            setKnocked(new Set());
            cursor.current = 0;
          }}
        >
          <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-mute">
            <span>
              Data <span className="num text-dim">0–9</span>
            </span>
            <span>
              Parity <span className="num text-dim">10–29</span>
            </span>
          </div>
          <div className="flex max-w-full flex-wrap gap-1">
            {Array.from({ length: TOTAL }, (_, index) => {
              const isData = index < DATA;
              const out = knocked.has(index);
              return (
                <span
                  key={index}
                  className={cn(
                    "num flex h-7 w-7 items-center justify-center border text-[11px]",
                    isData
                      ? "border-phosphor-edge bg-phosphor-dim text-phosphor"
                      : "border-line-strong bg-surface text-dim",
                    out && "opacity-25 line-through decoration-offline",
                  )}
                  aria-hidden
                >
                  {index}
                </span>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-[12px] text-dim" aria-live="polite">
          {hovering ? (
            <>
              <span className="num text-ink">{remaining}</span> shards visible ·{" "}
              {canRecover ? (
                <span className="text-phosphor">file still recoverable</span>
              ) : (
                <span className="text-offline">file lost</span>
              )}
            </>
          ) : (
            "Hover to simulate shard loss."
          )}
        </p>
      </div>
    </section>
  );
}
