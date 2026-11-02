"use client";

import { useState } from "react";
import { CapacityTape } from "@/components/capacity-tape";
import { DetailDrawer } from "@/components/detail-drawer";
import { ErasureStrip } from "@/components/erasure-strip";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { KpiStrip } from "@/components/kpi-strip";
import { MatchLine } from "@/components/match-line";
import { NeuronsTable } from "@/components/neurons-table";
import { NodesTable } from "@/components/nodes-table";
import { StorageWall } from "@/components/storage-wall";
import type { DashboardSelection } from "@/lib/selection";
import { useSnapshot } from "@/lib/use-snapshot";

export function Dashboard() {
  const query = useSnapshot();
  const snapshot = query.data;
  const [selection, setSelection] = useState<DashboardSelection | null>(null);

  return (
    <div className="min-h-full">
      <Header query={query} />
      <main className="border-t border-line">
        <KpiStrip snapshot={snapshot ?? null} />
        <MatchLine snapshot={snapshot ?? null} />
        <StorageWall
          nodes={snapshot?.nodes}
          onSelect={(id) => setSelection({ kind: "node", id })}
        />
        <CapacityTape nodes={snapshot?.nodes} />
        <NeuronsTable
          snapshot={snapshot}
          onSelect={(uid) => setSelection({ kind: "neuron", uid })}
        />
        <NodesTable
          snapshot={snapshot}
          onSelect={(id) => setSelection({ kind: "node", id })}
        />
        <ErasureStrip />
      </main>
      <Footer />
      <DetailDrawer
        selection={selection}
        snapshot={snapshot}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
