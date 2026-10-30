"use client";

import React, { useState } from "react";
import { Mail, Sparkles, AlertCircle, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { ExtractedQuote } from "@/types/procurement";
import { formatINR } from "@/lib/procurement";

const SAMPLE_EMAILS = [
  {
    title: "National Corrugators (Freight & Cashflow Risk)",
    text: `From: sales@nationalcorrugators.co.in
Subject: Revised quotation for 5-ply cartons - Ref #NC-8821

Dear Procurement Team,

Following up on your RFQ for 5-ply corrugated shipper boxes (120 GSM). We can offer a revised special unit rate of Rs. 37.90 per unit for an order quantity of 10,000 units (our MOQ).

Commercial Terms:
- Delivery Lead Time: 12 working days from confirmed purchase order
- Delivery Terms: Ex-works Vapi factory (Freight extra at actuals, approx Rs. 1.80/box)
- Payment: 30% advance with order, balance against dispatch documents
- Validity: 7 days due to kraft paper volatility

Let us know if you need sample approvals.

Warm regards,
Vikram Mehta
National Corrugators Ltd`,
  },
  {
    title: "Sunrise Labels (Clean Packaging Offer)",
    text: `From: priya.d@sunriselabels.com
Subject: Quotation: Shrink Label Rolls (Batch 2026)

Hi Sourcing Team,

Please find our best quote for Shrink label roll:
- Unit Price: INR 2,120 per roll
- Minimum Order Qty: 250 rolls
- Lead Time: 7 days
- Payment Terms: Net 45 days
- Delivery: Free Door Delivery to your Pune Facility (CIF)

All rates inclusive of standard quality inspection certificates.

Regards,
Priya Deshmukh
Sunrise Labels`,
  },
];

export const EmailParserModal: React.FC = () => {
  const [emailText, setEmailText] = useState(SAMPLE_EMAILS[0].text);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedQuote | null>(null);

  const handleExtract = async () => {
    setLoading(true);
    setExtracted(null);
    try {
      const res = await fetch("/api/extract-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const data = await res.json();
      if (data.success) {
        setExtracted(data.extraction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Unstructured Email Quote Parser
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Heizen resolves the procurement &quot;inbox problem&quot; by converting unformatted vendor emails into structured, audited line items.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
          {SAMPLE_EMAILS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setEmailText(sample.text);
                setExtracted(null);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-medium cursor-pointer"
            >
              Preset {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Text Area */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Raw Supplier Email or WhatsApp Quote:
          </label>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={10}
            className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 dark:text-slate-200"
            placeholder="Paste supplier email thread here..."
          />
          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Agent Extracting Commercial Terms..." : "Extract Terms & Calculate Landed TCO"}
          </button>
        </div>

        {/* Structured Output Cards */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-3">
            Structured Procurement Schema (AI Extracted):
          </label>

          {extracted ? (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                    {extracted.supplier}
                  </span>
                  <span className="text-xs text-slate-500">{extracted.item}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Extracted Rate</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatINR(extracted.unitPrice)} / unit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Time</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{extracted.deliveryDays} Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">MOQ</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{extracted.moq.toLocaleString()} Units</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Terms</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{extracted.paymentTerms}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Freight Terms</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{extracted.freightTerms}</span>
                </div>
              </div>

              {/* Detected Risk Flags */}
              <div className="mt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Procurement Risk &amp; TCO Analysis:
                </span>
                <div className="space-y-1.5">
                  {extracted.riskFlags.map((risk, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-orange-900 dark:text-orange-200"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Confidence Score: {(extracted.confidence * 100).toFixed(0)}%</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Against Taxonomy
                </span>
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">
                Click &quot;Extract Terms &amp; Calculate Landed TCO&quot; to test Claude&apos;s natural-language quote extraction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

