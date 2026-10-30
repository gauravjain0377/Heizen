"use client";

import React, { useState, useEffect, useRef } from "react";
import { PurchaseOrder, Finding, SupplierMemory } from "@/types/procurement";
import { INITIAL_POS, analyzePO, formatINR } from "@/lib/procurement";
import { ConnectionBar } from "@/components/ConnectionBar";
import { NegotiationDrawer } from "@/components/NegotiationDrawer";
import { QuoteMatrix } from "@/components/QuoteMatrix";
import { EmailParserModal } from "@/components/EmailParserModal";
import { InsightsCharts } from "@/components/InsightsCharts";
import { 
  Radar, 
  Upload, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  Mail, 
  BarChart3, 
  Sun, 
  Moon, 
  FileDown 
} from "lucide-react";

export default function Home() {
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [findings, setFindings] = useState<Finding[][]>([]);
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [coverage, setCoverage] = useState<number>(22);
  const [activeTab, setActiveTab] = useState<"leak" | "rfq" | "email" | "insights">("leak");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [bankedSavings, setBankedSavings] = useState<number>(0);
  const [supplierMemories, setSupplierMemories] = useState<Record<string, SupplierMemory>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize findings & load memories from localStorage
  useEffect(() => {
    const computed = pos.map((po, idx) => analyzePO(po, idx, pos));
    setFindings(computed);

    try {
      const stored = localStorage.getItem("heizen_supplier_memories");
      if (stored) {
        setSupplierMemories(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Storage not accessible:", e);
    }
  }, [pos]);

  // Handle Theme Toggle
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Run Animated Diagnostic Scan
  const handleRunScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScannedCount(0);
    setSelectedIndex(null);

    // Animate connector coverage
    let cov = 22;
    const covInterval = setInterval(() => {
      cov += 15;
      if (cov >= 99) {
        setCoverage(99);
        clearInterval(covInterval);
      } else {
        setCoverage(cov);
      }
    }, 250);

    // Animate PO rows
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setScannedCount(current);
      if (current >= pos.length) {
        clearInterval(interval);
        setIsScanning(false);
        // Automatically select the first actionable leak
        const firstActionable = findings.findIndex((fs) => fs.some((f) => f.rec));
        if (firstActionable !== -1) {
          setSelectedIndex(firstActionable);
        }
      }
    }, 180);
  };

  // Calculate totals
  let recoverableSum = 0;
  let atRiskSum = 0;

  findings.slice(0, scannedCount).forEach((fs) => {
    fs.forEach((f) => {
      if (f.rec) recoverableSum += f.amt;
      else atRiskSum += f.amt;
    });
  });

  const totalLeakage = recoverableSum + atRiskSum;

  // Handle Approval of Savings & Save Memory
  const handleApproveSavings = (savings: number, settledRate: number) => {
    setBankedSavings((prev) => prev + savings);
    if (selectedIndex !== null) {
      const supplier = pos[selectedIndex].s;
      const updatedMemories = {
        ...supplierMemories,
        [supplier]: {
          end: settledRate,
          flex: 0.55,
          lastNegotiated: new Date().toISOString(),
        },
      };
      setSupplierMemories(updatedMemories);
      try {
        localStorage.setItem("heizen_supplier_memories", JSON.stringify(updatedMemories));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // CSV Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map((c) => c.replace(/^"|"$/g, "").trim().toLowerCase());
      const findIdx = (regex: RegExp) => headers.findIndex((h) => regex.test(h));

      const sIdx = findIdx(/supplier|vendor/);
      const iIdx = findIdx(/item|desc|material/);
      const qIdx = findIdx(/qty|quant/);
      const pIdx = findIdx(/paid|unit|rate|price/);
      const cIdx = findIdx(/contract/);
      const mIdx = findIdx(/market|bench/);
      const aIdx = findIdx(/approv/);
      const xIdx = findIdx(/expir|days/);

      if (sIdx === -1 || qIdx === -1 || pIdx === -1) {
        alert("Uploaded CSV requires at least 'supplier', 'qty', and 'price' columns.");
        return;
      }

      const parsed: PurchaseOrder[] = lines.slice(1).map((line, idx) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        const num = (v: string | undefined) => (v && !isNaN(+v) ? +v : 0);
        return {
          id: `UP-${idx + 101}`,
          s: cols[sIdx] || "Unknown Supplier",
          i: iIdx !== -1 && cols[iIdx] ? cols[iIdx] : "Procured Item",
          q: num(cols[qIdx]) || 100,
          p: num(cols[pIdx]) || 100,
          c: cIdx !== -1 && cols[cIdx] ? num(cols[cIdx]) : null,
          m: mIdx !== -1 && cols[mIdx] ? num(cols[mIdx]) : num(cols[pIdx]),
          a: aIdx !== -1 && cols[aIdx] ? cols[aIdx] : null,
          x: xIdx !== -1 && cols[xIdx] ? num(cols[xIdx]) : 365,
          plant: "Custom Upload",
        };
      });

      setPos(parsed);
      setScannedCount(0);
      setSelectedIndex(null);
      alert(`Loaded ${parsed.length} purchase orders successfully. Click "Run Diagnostic Scan" to inspect.`);
    };
    reader.readAsText(file);
  };

  // Download Sample CSV
  const handleDownloadSample = () => {
    const csvContent =
      "supplier,item,qty,price,contract,market,approver,expiry_days,plant\n" +
      "Kaveri Packaging,5-ply corrugated box,12000,41.8,38.5,38.0,R. Sen,200,Pune\n" +
      "Aarav Edibles,Palm oil 15kg,800,1840,1760,1750,R. Sen,120,Hosur\n" +
      "Sunrise Labels,Shrink label roll,300,2290,,1980,M. Iyer,0,Jaipur\n" +
      "Metro Freight,Jaipur-Delhi route,40,17800,16500,16200,,90,Jaipur\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "heizen_procurement_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-teal-600 text-white shadow-md">
                <Radar className="w-6 h-6 animate-spin-slow" />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Heizen &bull; Procurement Intelligence
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Leakage Radar
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Autonomous long-tail spend audit &amp; negotiation agent. Ingests ERP records, detects price drift across master agreements, and recovers margin under human guardrails.
            </p>
          </div>

          {/* Metric Summary Card */}
          <div className="bg-slate-900 text-white dark:bg-slate-900 dark:border dark:border-slate-800 p-5 rounded-2xl min-w-[280px] shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                Total Spend Leakage
              </span>
              <div className="text-3xl font-black tracking-tight text-white mt-0.5">
                {formatINR(totalLeakage)}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-teal-400 font-semibold">{formatINR(recoverableSum)}</span>
                <span className="text-slate-400"> recoverable</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Locked in: </span>
                <span className="text-emerald-400 font-bold">{formatINR(bankedSavings)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Action Bar & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <button
              onClick={() => setActiveTab("leak")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "leak"
                  ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs cursor-default"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              Leakage Diagnostic
            </button>
            <button
              onClick={() => setActiveTab("rfq")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "rfq"
                  ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs cursor-default"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              RFQ Policy Matrix
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "email"
                  ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs cursor-default"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Inbox Quote Extractor
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "insights"
                  ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs cursor-default"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Cross-Site Insights
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Diagnostic Scan
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" /> Upload CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={handleDownloadSample}
              title="Download sample procurement CSV"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Integration Connection Banner */}
        <ConnectionBar coverage={coverage} />

        {/* TAB 1: LEAKAGE SCAN & NEGOTIATION */}
        {activeTab === "leak" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: PO Table */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Purchase Orders Ingested ({pos.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any flagged row to inspect evidence and deploy negotiation agent.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {scannedCount} of {pos.length} scanned
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">PO ID</th>
                      <th className="py-2.5 px-3">Supplier &amp; Material</th>
                      <th className="py-2.5 px-3">Plant</th>
                      <th className="py-2.5 px-3 text-right">Spend</th>
                      <th className="py-2.5 px-3">Audit Findings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {pos.map((r, idx) => {
                      const isScanned = idx < scannedCount;
                      const fList = findings[idx] || [];
                      const isSelected = selectedIndex === idx;
                      const hasLeak = fList.length > 0;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => isScanned && setSelectedIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-teal-50/80 dark:bg-teal-950/30"
                              : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          } ${hasLeak && isScanned ? "border-l-4 border-l-orange-500" : "border-l-4 border-l-transparent"}`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {r.id}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {r.s}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                              {r.i} &bull; {r.q.toLocaleString()} units @ {formatINR(r.p)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                            {r.plant || "HQ"}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                            {formatINR(r.p * r.q)}
                          </td>
                          <td className="py-3 px-3">
                            {!isScanned ? (
                              <span className="text-slate-400 italic">Waiting...</span>
                            ) : fList.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle className="w-3 h-3" /> Clean
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {fList.map((f, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      f.rec
                                        ? "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900"
                                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                    }`}
                                  >
                                    {f.l}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Negotiation & Decision Engine */}
            <div className="lg:col-span-5">
              {selectedIndex !== null && findings[selectedIndex] && findings[selectedIndex].length > 0 ? (
                <NegotiationDrawer
                  po={pos[selectedIndex]}
                  finding={findings[selectedIndex].find((x) => x.rec) || findings[selectedIndex][0]}
                  onApprove={handleApproveSavings}
                  memory={supplierMemories[pos[selectedIndex].s]}
                />
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 text-slate-400">
                    <Radar className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                    Select a Flagged Order to Inspect
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Run the diagnostic scan, then click any order highlighted in orange to review evidence, launch the live negotiation agent, or issue automated credit notes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RFQ POLICY COMPARISON */}
        {activeTab === "rfq" && <QuoteMatrix />}

        {/* TAB 3: INBOX QUOTE EXTRACTOR */}
        {activeTab === "email" && <EmailParserModal />}

        {/* TAB 4: CROSS-SITE INSIGHTS */}
        {activeTab === "insights" && <InsightsCharts pos={pos} findings={findings} />}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            Built by Gaurav Jain for Heizen &bull; Synthetic dataset modeled on FMCG &amp; packaging supply chains.
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Zero Black-Box Rules
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
