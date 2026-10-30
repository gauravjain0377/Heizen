"use client";

import React, { useState } from "react";
import { Quote } from "@/types/procurement";
import { formatINR } from "@/lib/procurement";
import { Sliders, Award, AlertCircle, CheckCircle2 } from "lucide-react";

const INITIAL_QUOTES: Quote[] = [
  { n: "Kaveri Packaging", p: 38.5, r: 94, l: 14 },
  { n: "Orbit Boxes", p: 36.2, r: 81, l: 21 },
  { n: "Deccan Pack", p: 39.9, r: 97, l: 9 },
  { n: "National Corrugators", p: 37.9, r: 89, l: 12 },
];

export const QuoteMatrix: React.FC = () => {
  const [weights, setWeights] = useState({ price: 6, reliability: 3, leadTime: 2 });
  const [orderQty, setOrderQty] = useState(12000);

  // Normalization logic: higher score is always better (price & leadTime are inverted, reliability is direct)
  const sumWeights = (weights.price + weights.reliability + weights.leadTime) || 1;
  const minP = Math.min(...INITIAL_QUOTES.map((q) => q.p));
  const maxP = Math.max(...INITIAL_QUOTES.map((q) => q.p));
  const minL = Math.min(...INITIAL_QUOTES.map((q) => q.l));
  const maxL = Math.max(...INITIAL_QUOTES.map((q) => q.l));
  const minR = Math.min(...INITIAL_QUOTES.map((q) => q.r));
  const maxR = Math.max(...INITIAL_QUOTES.map((q) => q.r));

  const scoredQuotes: Quote[] = INITIAL_QUOTES.map((q) => {
    const normP = maxP === minP ? 1 : 1 - (q.p - minP) / (maxP - minP);
    const normL = maxL === minL ? 1 : 1 - (q.l - minL) / (maxL - minL);
    const normR = maxR === minR ? 1 : (q.r - minR) / (maxR - minR);

    const score = ((weights.price * normP + weights.reliability * normR + weights.leadTime * normL) / sumWeights) * 100;
    return { ...q, s: Math.round(score) };
  });

  const bestQuote = scoredQuotes.reduce((prev, curr) => ((curr.s || 0) > (prev.s || 0) ? curr : prev));
  const worstPrice = Math.max(...INITIAL_QUOTES.map((q) => q.p));
  const totalSavings = (worstPrice - bestQuote.p) * orderQty;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            Policy-Weighted RFQ Comparison Engine
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            RFQ: 5-ply corrugated shipper box &bull; Volume: {orderQty.toLocaleString()} units
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
            Optimal Selection Savings
          </span>
          <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
            {formatINR(totalSavings)}
          </span>
        </div>
      </div>

      {/* Sliders for weights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700 dark:text-slate-300">Price Weight:</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">{weights.price} / 10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={weights.price}
            onChange={(e) => setWeights({ ...weights, price: +e.target.value })}
            className="w-full accent-teal-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700 dark:text-slate-300">Reliability &amp; SLA Weight:</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">{weights.reliability} / 10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={weights.reliability}
            onChange={(e) => setWeights({ ...weights, reliability: +e.target.value })}
            className="w-full accent-teal-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700 dark:text-slate-300">Lead Time Speed Weight:</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">{weights.leadTime} / 10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={weights.leadTime}
            onChange={(e) => setWeights({ ...weights, leadTime: +e.target.value })}
            className="w-full accent-teal-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Scored Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scoredQuotes.map((q) => {
          const isWinner = q.n === bestQuote.n;
          return (
            <div
              key={q.n}
              className={`p-4 rounded-xl border transition-all ${
                isWinner
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{q.n}</span>
                {isWinner && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                    <Award className="w-3 h-3" /> Best Fit
                  </span>
                )}
              </div>

              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                {formatINR(q.p)}
                <span className="text-xs font-normal text-slate-400"> / unit</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex justify-between">
                  <span>OTIF Delivery:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{q.r}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Time:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{q.l} days</span>
                </div>
              </div>

              {q.r < 85 && (
                <div className="mb-3 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-3 h-3" /> Requires VP Sign-off (&lt;85% SLA)
                </div>
              )}

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-500">Policy Match Score:</span>
                  <span className={isWinner ? "text-teal-600 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"}>
                    {q.s} / 100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWinner ? "bg-teal-500" : "bg-slate-400 dark:bg-slate-600"
                    }`}
                    style={{ width: `${q.s}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          <strong>Agent Rationale:</strong> Under the active policy weighting ({weights.price}x Price, {weights.reliability}x Reliability, {weights.leadTime}x Speed),{" "}
          <strong>{bestQuote.n}</strong> yields the lowest Total Landed Risk while preserving ₹{totalSavings.toLocaleString("en-IN")} in gross margin against the highest bidder.
        </span>
      </div>
    </div>
  );
};

