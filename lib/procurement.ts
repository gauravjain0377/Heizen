import { PurchaseOrder, Finding } from "@/types/procurement";

export const INITIAL_POS: PurchaseOrder[] = [
  { id: "PO-4101", s: "Kaveri Packaging", i: "5-ply corrugated box", q: 12000, p: 41.8, c: 38.5, m: 38.0, a: "R. Sen", x: 200, plant: "Pune Plant", category: "Packaging" },
  { id: "PO-4107", s: "Aarav Edibles", i: "Palm oil, 15 kg tin", q: 800, p: 1840, c: 1760, m: 1750, a: "R. Sen", x: 120, plant: "Hosur Plant", category: "Raw Material" },
  { id: "PO-4110", s: "Sunrise Labels", i: "Shrink label roll", q: 300, p: 2290, c: null, m: 1980, a: "M. Iyer", x: 0, plant: "Jaipur Plant", category: "Packaging" },
  { id: "PO-4111", s: "Sunrise Labels", i: "Shrink label roll", q: 300, p: 2290, c: null, m: 1980, a: "M. Iyer", x: 0, plant: "Jaipur Plant", category: "Packaging" },
  { id: "PO-4115", s: "Metro Freight", i: "Jaipur to Delhi trip", q: 40, p: 17800, c: 16500, m: 16200, a: null, x: 90, plant: "Jaipur Plant", category: "Logistics" },
  { id: "PO-4118", s: "Himal Spices", i: "Cardamom, 5 kg", q: 120, p: 7400, c: 7400, m: 7350, a: "R. Sen", x: 300, plant: "Hosur Plant", category: "Raw Material" },
  { id: "PO-4120", s: "Bolt Pallets", i: "HDPE pallet", q: 500, p: 640, c: null, m: 585, a: "M. Iyer", x: 0, plant: "Pune Plant", category: "MRO" },
  { id: "PO-4123", s: "Aarav Edibles", i: "Palm oil, 15 kg tin", q: 600, p: 1760, c: 1760, m: 1750, a: "R. Sen", x: 120, plant: "Hosur Plant", category: "Raw Material" },
  { id: "PO-4126", s: "Greenline Cartons", i: "Mono carton", q: 20000, p: 6.9, c: 6.9, m: 6.9, a: "R. Sen", x: 12, plant: "Pune Plant", category: "Packaging" },
  { id: "PO-4130", s: "Kaveri Packaging", i: "5-ply corrugated box", q: 6000, p: 38.5, c: 38.5, m: 38.0, a: "R. Sen", x: 200, plant: "Jaipur Plant", category: "Packaging" },
  { id: "PO-4134", s: "Apex Adhesives", i: "Hot melt adhesive 25kg", q: 90, p: 4850, c: 4500, m: 4400, a: "R. Sen", x: 45, plant: "Pune Plant", category: "MRO" },
  { id: "PO-4139", s: "Kaveri Packaging", i: "5-ply corrugated box", q: 8500, p: 42.2, c: 38.5, m: 38.0, a: null, x: 200, plant: "Kolkata Plant", category: "Packaging" },
];

export const APPROVAL_LIMIT = 200000; // INR

export function formatINR(val: number): string {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

export function analyzePO(r: PurchaseOrder, idx: number, allPOs: PurchaseOrder[]): Finding[] {
  const f: Finding[] = [];
  const spend = r.p * r.q;

  // Rule 1: Paid above contract price
  if (r.c && r.p > r.c * 1.02) {
    f.push({
      t: "price",
      l: "Above contract",
      amt: (r.p - r.c) * r.q,
      rec: true,
      why: `Billed at ${formatINR(r.p)} vs contracted rate of ${formatINR(r.c)}. Price drift of ${(((r.p - r.c) / r.c) * 100).toFixed(1)}%.`,
      target: r.c,
    });
  }

  // Rule 2: Off-contract purchase above market benchmark
  if (!r.c && r.p > r.m * 1.03) {
    f.push({
      t: "off",
      l: "Off contract",
      amt: (r.p - r.m) * r.q,
      rec: true,
      why: `No Master Service Agreement. Market benchmark is ${formatINR(r.m)}, paid ${formatINR(r.p)} (${(((r.p - r.m) / r.m) * 100).toFixed(1)}% above benchmark).`,
      target: r.m,
    });
  }

  // Rule 3: Duplicate order to the same supplier earlier
  if (allPOs.slice(0, idx).some((o) => o.s === r.s && o.i === r.i && o.q === r.q)) {
    f.push({
      t: "dup",
      l: "Duplicate order",
      amt: spend,
      rec: true,
      why: `Identical order (${r.q.toLocaleString()} units of ${r.i}) issued previously to ${r.s}. Likely unmerged or duplicate PO.`,
      target: 0,
    });
  }

  // Rule 4: High-value order missing authorized approval
  if (spend > APPROVAL_LIMIT && !r.a) {
    f.push({
      t: "appr",
      l: "No approval",
      amt: spend,
      rec: false,
      why: `Order value of ${formatINR(spend)} exceeds delegated authority threshold (${formatINR(APPROVAL_LIMIT)}) without an authorized approver.`,
    });
  }

  // Rule 5: Contract expiring within 30 days
  if (r.c && r.x < 30) {
    f.push({
      t: "renew",
      l: "Contract expiring",
      amt: spend * 0.04,
      rec: false,
      why: `Agreement expires in ${r.x} days. Unrenegotiated contracts experience ~4% unhedged price escalation.`,
    });
  }

  return f;
}

