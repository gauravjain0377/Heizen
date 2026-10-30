"use client";

import React from "react";
import { PurchaseOrder, Finding } from "@/types/procurement";
import { formatINR } from "@/lib/procurement";
import { TrendingUp, Factory, Calendar, DollarSign, ArrowUpRight } from "lucide-react";

interface InsightsChartsProps {
  pos: PurchaseOrder[];
  findings: Finding[][];
}

export const InsightsCharts: React.FC<InsightsChartsProps> = ({ pos, findings }) => {
  // 1. Supplier Benchmark (Recoverable Cash Leakage by Vendor)
  const leakageBySupplier: Record<string, number> = {};
  findings.forEach((fs, idx) => {
    fs.filter((f) => f.rec).forEach((f) => {
      const supp = pos[idx].s;
      leakageBySupplier[supp] = (leakageBySupplier[supp] || 0) + f.amt;
    });
  });

  const sortedSuppliers = Object.entries(leakageBySupplier).sort((a, b) => b[1] - a[1]);
  const maxSupplierLeakage = sortedSuppliers.length ? sortedSuppliers[0][1] : 1;

  // 2. Cross-Site Price Dispersion (The Heizen Multi-Plant Arbitrage)
  // Group identical items across plants
  const plantVariances = [
    {
      item: "5-ply corrugated box",
      baseline: 38.5,
      sites: [
        { plant: "Pune Plant", paid: 41.8, variance: "+8.5%", risk: "high" },
        { plant: "Jaipur Plant", paid: 38.5, variance: "0.0%", risk: "optimal" },
        { plant: "Kolkata Plant", paid: 42.2, variance: "+9.6%", risk: "high" },
      ],
      arbitrageSavings: 71000,
    },
    {
      item: "Palm oil, 15 kg tin",
      baseline: 1750,
      sites: [
        { plant: "Hosur Plant", paid: 1840, variance: "+5.1%", risk: "medium" },
        { plant: "Pune Plant", paid: 1760, variance: "+0.5%", risk: "optimal" },
      ],
      arbitrageSavings: 64000,
    },
  ];

  // 3. Rollout sprint roadmap
  const sprintPlan = [
    { span: "Weeks 1 - 2", title: "Data Mapping & ERP Integration", desc: "Connect SAP, Oracle, Sheets & emails into unified semantic graph." },
    { span: "Week 3", title: "ROI & Leakage Audit", desc: "Run deterministic rules across 12-month PO history to prioritize categories." },
    { span: "Weeks 4 - 5", title: "Agent Deployment & Guardrails", desc: "Deploy autonomous negotiation bots with strict walkaway price ceilings." },
    { span: "Week 6", title: "User Acceptance & Approval Flow", desc: "CPO and category managers fine-tune sign-off workflows." },
    { span: "Weeks 7 - 8", title: "Live Production in Cloud VPC", desc: "Deployed directly inside client's AWS/GCP/Azure tenant." },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row: Plant Dispersion + Supplier Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Plant Arbitrage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-indigo-600" />
                Cross-Plant Price Dispersion (Arbitrage)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Identical SKUs purchased at divergent rates across regional manufacturing sites.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Heizen Sourcing Moat
            </span>
          </div>

          <div className="space-y-4">
            {plantVariances.map((item) => (
              <div key={item.item} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{item.item}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Est. Arbitrage: {formatINR(item.arbitrageSavings)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {item.sites.map((site) => (
                    <div
                      key={site.plant}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                    >
                      <span className="text-[10px] text-slate-400 block font-medium">{site.plant}</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{formatINR(site.paid)}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            site.risk === "high"
                              ? "text-orange-600"
                              : site.risk === "medium"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {site.variance}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Benchmark */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Recoverable Leakage by Supplier
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized vendor outreach based on contract variance and unhedged drift.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedSuppliers.length > 0 ? (
              sortedSuppliers.map(([supplier, amount]) => {
                const percentage = (amount / maxSupplierLeakage) * 100;
                return (
                  <div key={supplier} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{supplier}</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{formatINR(amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recoverable leakage detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* 8-Week Heizen Deployment Sprint */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              From Diagnostic to Production: 8-Week Delivery Model
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Heizen replaces rigid multi-year SaaS rollouts with forward-deployed engineering sprints.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {sprintPlan.map((sprint, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                  {sprint.span}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                  {sprint.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {sprint.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

