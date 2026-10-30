"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Database, FileSpreadsheet, Mail, FileText, ArrowRight } from "lucide-react";

interface ConnectionBarProps {
  coverage: number;
}

export const ConnectionBar: React.FC<ConnectionBarProps> = ({ coverage }) => {
  const systems = [
    { name: "ERP (SAP/Oracle)", icon: Database, delay: 0 },
    { name: "Procurement Sheets", icon: FileSpreadsheet, delay: 200 },
    { name: "Supplier Inboxes", icon: Mail, delay: 400 },
    { name: "Contracts & MSAs", icon: FileText, delay: 600 },
    { name: "Vendor Portals", icon: ShieldCheck, delay: 800 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Heizen Sourcing Fabric
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Mapping fragmented ERP tables, emails, and contracts into a unified decision graph
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {systems.map((s, idx) => {
            const Icon = s.icon;
            const isLive = coverage > (idx * 18);
            return (
              <div
                key={s.name}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                  isLive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isLive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                <span>{s.name}</span>
                {isLive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-2 lg:pt-0">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Context Coverage</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {coverage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

