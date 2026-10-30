import { NextRequest, NextResponse } from "next/server";

interface NegotiationRequest {
  po: {
    id: string;
    s: string;
    i: string;
    q: number;
    p: number;
    c: number | null;
    m: number;
  };
  finding: {
    t: string;
    l: string;
    amt: number;
    target: number;
  };
  tone: "firm" | "partner";
  round: number;
  history: Array<{ sender: "agent" | "supplier"; message: string }>;
  memory?: { end: number; flex: number };
}

export async function POST(req: NextRequest) {
  try {
    const body: NegotiationRequest = await req.json();
    const { po, finding, tone, round, history, memory } = body;

    const target = finding.target || (po.c ?? po.m);
    const mid = Math.round((po.p + target) / 2);
    const flex = memory?.flex ?? (0.5 + (po.s.length % 5) * 0.08);

    // Check if user has provided an Anthropic Claude or OpenAI API key in environment
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 600,
            system: `You are Heizen's Autonomous Procurement Negotiation Engine.
You simulate a realistic B2B supplier negotiation dialogue based on procurement policy:
- Purchase Order: ${po.id}
- Supplier: ${po.s}
- Item: ${po.i} (${po.q} units)
- Paid/Billed Rate: ₹${po.p}
- Contracted / Market Target: ₹${target}
- Minimum acceptable floor/fallback: ₹${mid}
- Tone style: ${tone} (firm = contract-enforcing, partnership = collaborative volume-leveraged)
- Supplier Memory: ${memory ? `Past settlement at ₹${memory.end}` : "First recorded interaction"}

Respond ONLY with a valid JSON object matching:
{
  "agent_message": "string (what Heizen's agent says)",
  "supplier_message": "string (supplier's counter-offer response)",
  "agreed_rate": number or null,
  "savings": number or null,
  "is_final": boolean,
  "strategy_note": "string (brief note explaining rationale)"
}`,
            messages: [
              {
                role: "user",
                content: `This is round ${round}. History of dialogue: ${JSON.stringify(history)}. Generate the next back-and-forth negotiation round.`,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content?.[0]?.text;
          const parsed = JSON.parse(content);
          return NextResponse.json({ success: true, ...parsed, live_model: "claude-3-5-sonnet" });
        }
      } catch (err) {
        console.warn("Claude API call fallback to deterministic bounded engine:", err);
      }
    }

    // High-fidelity fallback negotiation engine with mathematical bounds & supplier persona
    if (round === 1) {
      const anchorIntro = memory
        ? `Referencing our previous settlement with ${po.s} at ₹${memory.end}/unit, `
        : "";
      const openingAgent =
        tone === "firm"
          ? `${anchorIntro}Invoice for ${po.id} (${po.i}) was billed at ₹${po.p}/unit. Our contract specifies ₹${target}/unit. Please reissue the invoice with credit adjustment for ₹${(po.p - target) * po.q}.`
          : `We value our partnership with ${po.s} on ${po.i}. We noticed ${po.id} was billed at ₹${po.p}/unit, whereas our benchmark/contract target is ₹${target}/unit. We want to align this to maintain volume allocations.`;

      const counter1 = Math.round(po.p - (po.p - target) * flex * 0.4);
      const supplierPushback = `Our production & raw material costs surged this quarter. We cannot honor ₹${target}, but we can offer a concession to ₹${counter1}/unit for this batch.`;

      return NextResponse.json({
        success: true,
        agent_message: openingAgent,
        supplier_message: supplierPushback,
        agreed_rate: null,
        savings: null,
        is_final: false,
        strategy_note: `Anchored at target price ₹${target}. Supplier countered with initial concession of ₹${po.p - counter1}/unit.`,
      });
    }

    if (round === 2) {
      const agentLeverage =
        tone === "firm"
          ? `We have confirmed upcoming quarterly requirements across plants. We can commit to locking in the next 2 POs exclusively with ${po.s} if you adjust this consignment to ₹${mid}/unit.`
          : `If you can meet us at ₹${mid}/unit for this lot, we can fast-track approval and schedule next month's repeat order early.`;

      const settledRate = Math.round(po.p - (po.p - target) * flex);
      const totalSavings = (po.p - settledRate) * po.q;
      const supplierFinal = `Understood. In consideration of the upcoming volume commitment, we agree to finalize this order at ₹${settledRate}/unit. Please generate the revised PO.`;

      return NextResponse.json({
        success: true,
        agent_message: agentLeverage,
        supplier_message: supplierFinal,
        agreed_rate: settledRate,
        savings: totalSavings,
        is_final: true,
        strategy_note: `Leveraged volume guarantee. Final settlement reached at ₹${settledRate}/unit (Banked ₹${totalSavings.toLocaleString("en-IN")}).`,
      });
    }

    return NextResponse.json({
      success: true,
      agent_message: `Terms agreed at negotiated rate. Awaiting internal procurement signing.`,
      supplier_message: `Acknowledgment sent. Ready for dispatch confirmation.`,
      agreed_rate: target,
      savings: (po.p - target) * po.q,
      is_final: true,
      strategy_note: "Negotiation completed.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

