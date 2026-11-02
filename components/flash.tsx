"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function useFlash(signal: string | number | null): boolean {
  const previous = useRef<string | number | null | undefined>(undefined);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (previous.current === undefined) {
      previous.current = signal;
      return;
    }
    if (previous.current === signal) return;
    previous.current = signal;
    setOn(true);
    const timeout = window.setTimeout(() => setOn(false), 600);
    return () => window.clearTimeout(timeout);
  }, [signal]);

  return on;
}

export function Flash({
  signal,
  className,
  children,
}: {
  signal: string | number;
  className?: string;
  children: React.ReactNode;
}) {
  const on = useFlash(signal);
  return <span className={cn(className, on && "num-flash")}>{children}</span>;
}
