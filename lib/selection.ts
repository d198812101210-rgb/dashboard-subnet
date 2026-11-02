export type DashboardSelection =
  | { kind: "neuron"; uid: number }
  | { kind: "node"; id: string };
