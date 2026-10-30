export interface PurchaseOrder {
  id: string;
  s: string;       // Supplier name
  i: string;       // Item / Material description
  q: number;       // Quantity
  p: number;       // Price paid per unit (in INR)
  c: number | null;// Agreed contract price per unit (null if no contract)
  m: number;       // Market benchmark rate
  a: string | null;// Approver on record (null if missing)
  x: number;       // Days until contract expiry
  plant?: string;  // Manufacturing plant or site (e.g., Pune, Jaipur, Hosur)
  category?: string; // Packaging, Raw Material, Logistics, MRO
}

export interface Finding {
  t: "price" | "off" | "dup" | "appr" | "renew";
  l: string;       // Label e.g. "Above contract", "Off contract"
  amt: number;     // Financial leakage amount
  rec: boolean;    // Recoverable cash vs compliance risk
  why: string;     // Transparent rationale
  target?: number; // Target price per unit
}

export interface SupplierMemory {
  end: number;     // Last agreed settlement price
  flex: number;    // Supplier flexibility factor
  lastNegotiated: string;
}

export interface Quote {
  n: string;       // Supplier name
  p: number;       // Quoted unit price
  r: number;       // Reliability %
  l: number;       // Lead time (days)
  s?: number;      // Calculated composite score
}

export interface ExtractedQuote {
  supplier: string;
  item: string;
  unitPrice: number;
  currency: string;
  deliveryDays: number;
  moq: number;
  paymentTerms: string;
  freightTerms: string;
  riskFlags: string[];
  confidence: number;
}

