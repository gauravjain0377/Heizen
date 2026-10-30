"use client";

import React, { useState } from "react";
import { PurchaseOrder, Finding } from "@/types/procurement";
import { formatINR } from "@/lib/procurement";
import { Bot, CheckCircle, AlertTriangle, Send, Sparkles, UserCheck, ShieldAlert, FileSignature } from "lucide-react";
import confetti from "canvas-confetti";

interface NegotiationDrawerProps {
  po: PurchaseOrder;
  finding: Finding;
  onApprove: (savings: number, settledRate: number) => void;
  memory?: { end: number; flex: number };
}

interface Message {
  sender: "agent" | "supplier" | "system";
  text: string;
}

export const NegotiationDrawer: React.FC<NegotiationDrawerProps> = ({
  po,
  finding,
  onApprove,
  memory,
}) => {
  const [tone, setTone] = useState<"firm" | "partner">("firm");
  const [round, setRound] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [agreedRate, setAgreedRate] = useState<number | null>(null);
  const [currentSavings, setCurrentSavings] = useState<number | null>(null);
  const [approved, setApproved] = useState(false);

  const target = finding.target || (po.c ?? po.m);
  const fallback = Math.round((po.p + target) / 2);

  const startNegotiation = async () => {
    setLoading(true);
    setMessages([]);
    setRound(1);
    setIsFinal(false);
    setAgreedRate(null);
    setCurrentSavings(null);
    setApproved(false);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          po,
          finding,
          tone,
          round: 1,
          history: [],
          memory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newMsgs: Message[] = [];
        if (memory) {
          newMsgs.push({
            sender: "system",
            text: `Supplier Memory Active: ${po.s} previously settled at ${formatINR(memory.end)} per unit. Anchoring outreach.`,
          });
        }
        newMsgs.push({ sender: "agent", text: data.agent_message });
        newMsgs.push({ sender: "supplier", text: data.supplier_message });
        setMessages(newMsgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const advanceNegotiation = async () => {
    setLoading(true);
    const nextRound = round + 1;
    setRound(nextRound);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          po,
          finding,
          tone,
          round: nextRound,
          history: messages.map((m) => ({ sender: m.sender, message: m.text })),
          memory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: "agent", text: data.agent_message },
          { sender: "supplier", text: data.supplier_message },
        ]);
        if (data.is_final) {
          setIsFinal(true);
          setAgreedRate(data.agreed_rate);
          setCurrentSavings(data.savings);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (currentSavings && agreedRate) {
      onApprove(currentSavings, agreedRate);
      setApproved(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Autonomous Negotiation Agent
              </h3>
              <p className="text-xs text-slate-500">
                {po.s} &bull; {po.id} &bull; {po.plant || "Enterprise HQ"}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Leakage Identified
          </span>
          <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">
            {formatINR(finding.amt)}
          </span>
        </div>
      </div>

      {/* Finding Explanation Banner */}
      <div className="bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 rounded-xl p-3.5 mb-5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-orange-900 dark:text-orange-200">
          <span className="font-semibold">{finding.l}: </span>
          {finding.why}
        </div>
      </div>

      {/* Negotiation Parameters & Guardrails */}
      {finding.rec && finding.t !== "dup" ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed Rate</span>
              <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {formatINR(po.p)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fallback Floor</span>
              <span className="text-base font-extrabold text-slate-700 dark:text-slate-300">
                {formatINR(fallback)}
              </span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Target Rate</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                {formatINR(target)}
              </span>
            </div>
          </div>

          {/* Tone Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Negotiation Strategy Tone:
            </span>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setTone("firm")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  tone === "firm"
                    ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs cursor-default"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer"
                }`}
              >
                Contract Enforcement (Firm)
              </button>
              <button
                onClick={() => setTone("partner")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  tone === "partner"
                    ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs cursor-default"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer"
                }`}
              >
                Volume Leverage (Partnership)
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          {messages.length > 0 && (
            <div className="space-y-3 mb-5 max-h-80 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-3 rounded-xl ${
                    m.sender === "system"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900 text-center font-medium"
                      : m.sender === "agent"
                      ? "bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-slate-800 dark:text-slate-200 ml-0 mr-6"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 ml-6 mr-0 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1 opacity-70">
                    {m.sender === "agent" && <Bot className="w-3.5 h-3.5 text-teal-600" />}
                    {m.sender === "supplier" && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                    <span>{m.sender === "agent" ? "Heizen Buyer Agent" : m.sender === "supplier" ? po.s : "Memory Context"}</span>
                  </div>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <button
                onClick={startNegotiation}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Agent Formulating Strategy..." : "Initiate Autonomous Negotiation"}
              </button>
            ) : !isFinal ? (
              <button
                onClick={advanceNegotiation}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 font-semibold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? "Running Counter-Offer Simulation..." : "Deploy Counter-Offer (Round 2)"}
              </button>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                      Negotiation Concluded
                    </span>
                    <span className="text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                      Agreed settlement: {agreedRate ? formatINR(agreedRate) : "N/A"}/unit
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                      Secured Savings
                    </span>
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                      {currentSavings ? formatINR(currentSavings) : "₹0"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleApprove}
                  disabled={approved}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    approved
                      ? "bg-emerald-700 text-white cursor-default"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                  }`}
                >
                  <FileSignature className="w-4 h-4" />
                  {approved ? "Authorized & Synced to ERP Ledger" : "Chief Procurement Officer Approval Required"}
                </button>
              </div>
            )}
          </div>
        </>
      ) : finding.t === "dup" ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold block mb-1">Recommended Action: Hold Payment & Request Credit Note</span>
            Two identical shipments of {po.i} ({po.q} units) were recorded for {po.s}. Immediate automated credit note request can recover full leakage of {formatINR(finding.amt)}.
          </div>
          <button
            onClick={() => {
              onApprove(finding.amt, 0);
              setApproved(true);
            }}
            disabled={approved}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            {approved ? "Credit Note Request Logged" : `Issue Instant Credit Note Request (${formatINR(finding.amt)})`}
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold block mb-1">Governance & Compliance Flag</span>
          This is an operational approval / expiry risk rather than directly recoverable cash. Routing to Sourcing Category Lead for approval and renewal renegotiation.
        </div>
      )}
    </div>
  );
};

