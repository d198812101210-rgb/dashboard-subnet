"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-line text-dim hover:text-ink"
      aria-label={copied ? "Copied" : label}
      onClick={async (event) => {
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-phosphor" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}
