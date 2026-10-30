# Leakage Radar | Heizen Procurement Intelligence

> **Autonomous Long-Tail Spend Audit & Sourcing Agent** built for the Heizen forward-deployed enterprise stack.

---

## 🎯 What This Solves

Enterprises lose millions in procurement leakage across their "long-tail" spend—the 80% of vendors outside the top 10% that human category managers don't have time to audit.
- Unhedged price drift above Master Service Agreements (MSAs)
- Off-contract purchases at inflated spot market rates
- Identical duplicate orders
- Missing approval controls on high-value spend
- Expiring contracts leading to unnegotiated rate escalations

**Leakage Radar** replicates Heizen’s proven 5-step operational loop:
1. **Connect & Map:** Ingest fragmented ERP, spreadsheets, vendor emails, and contracts into a unified graph.
2. **Deterministic Audit:** Zero black boxes. Flag recoverable leakage using 5 explicit rules.
3. **Autonomous Negotiation Agent:** Deploy Claude-driven agents with strict walkaway bounds and supplier settlement memory.
4. **Human-in-the-Loop Sign-off:** CPO / Category Lead authorization with audit logs before syncing to ERP.
5. **Cross-Site Arbitrage & RFQ Policy Scoring:** Standardize rates across manufacturing plants and compare quotes across Price, SLA, and Lead Time.

---

## ⚡ Features Included

- **Autonomous Negotiation Agent (`/api/negotiate`)**: Live multi-round supplier negotiation engine. Includes firm vs. partnership tone toggles, supplier memory, and ceiling price guardrails. Connects to Claude 3.5 Sonnet when `ANTHROPIC_API_KEY` is provided, with an intelligent fallback.
- **Unstructured Email Quote Extractor (`/api/extract-quote`)**: Solves the "inbox problem" by extracting rates, MOQs, lead times, freight terms (Ex-Works vs CIF), and cash flow risks from messy email text.
- **Cross-Site Price Dispersion (Plant Arbitrage)**: Highlights identical materials purchased across Pune, Jaipur, and Hosur plants with immediate arbitrage recovery figures.
- **Policy-Weighted RFQ Comparison**: Real-time slider weights for Price, SLA Reliability, and Lead Time with automatic best-fit ranking.
- **CSV Ingestion**: Upload custom enterprise purchase order datasets or download the included sample template.
- **Supplier Memory**: Remembers past settlement rates across sessions to anchor subsequent rounds.

---

## 🚀 Getting Started

### 1. Installation & Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Live Claude API Setup (Optional)
Copy `.env.example` to `.env.local` and add your Anthropic key:
```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
```
*(Note: If no API key is provided, the application runs on its built-in bounded negotiation engine.)*

### 3. Deploy to Vercel
Push this repository to GitHub and link it directly on [Vercel](https://vercel.com).
- Framework Preset: `Next.js`
- Root Directory: `./` (default)
- Environment Variables (Optional): `ANTHROPIC_API_KEY`

---

## 📂 Repository Structure

- `app/` - Next.js App Router, pages, and API routes (`/api/negotiate`, `/api/extract-quote`)
- `components/` - React UI components (ConnectionBar, Modals, Audit cards, etc.)
- `lib/` - Procurement rules, heuristics, and agent negotiation engines
- `public/` - Sample datasets and static templates
- `prototypes/` - Early standalone HTML wireframes & design mockups
- `SUBMISSION_NOTE.md` - Technical architecture & business rationale submission note

---

## 📄 Synthetic Data Disclosure
All procurement data, supplier identities, and contract rates are synthetic, modeled on real FMCG, CPG, and packaging supply chain structures.
