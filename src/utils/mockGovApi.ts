/**
 * Mock aggregation layer that simulates fetching taxes & obligations
 * from multiple Romanian official sources in parallel.
 *
 * Real-world sources this mirrors:
 *  - ANAF SPV (Spațiul Privat Virtual) — taxe centrale, declarații
 *  - Ghișeul.ro — agregator național de taxe locale
 *  - Primărie locală (ex. Cluj-Napoca) — impozit clădire, auto, teren
 *  - DRPCIV — amenzi & taxe permis/vehicule
 *  - CNAS — contribuții sănătate restante
 *
 * In MVP, each "endpoint" is a Promise that resolves with mock data
 * after a short delay so we can show a realistic loading state.
 */

export type TaxStatus = "due" | "overdue" | "paid";

export type GovTax = {
  id: string;
  source: "ANAF" | "Ghișeul.ro" | "Primărie" | "DRPCIV" | "CNAS";
  endpoint: string; // mock endpoint URL, for the demo "API call"
  label: string;
  institution: string;
  amount: number; // RON
  dueDate: string; // ISO
  status: TaxStatus;
  legalRef?: string;
};

export type SourceResult = {
  source: GovTax["source"];
  endpoint: string;
  ok: boolean;
  fetchedAt: string;
  latencyMs: number;
  taxes: GovTax[];
};

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

async function fetchAnaf(): Promise<SourceResult> {
  const t0 = Date.now();
  const taxes: GovTax[] = [
    {
      id: "anaf-1", source: "ANAF",
      endpoint: "https://api.anaf.ro/spv/v1/obligatii",
      label: "Impozit pe venit — diferență 2025",
      institution: "ANAF",
      amount: 420, dueDate: "2026-07-25", status: "due",
      legalRef: "Cod fiscal art. 122",
    },
    {
      id: "anaf-2", source: "ANAF",
      endpoint: "https://api.anaf.ro/spv/v1/obligatii",
      label: "CASS persoane fizice 2025",
      institution: "ANAF",
      amount: 270, dueDate: "2026-05-25", status: "overdue",
      legalRef: "Cod fiscal art. 170",
    },
  ];
  return delay(420, { source: "ANAF", endpoint: "https://api.anaf.ro/spv/v1/obligatii", ok: true, fetchedAt: new Date().toISOString(), latencyMs: Date.now() - t0 + 420, taxes });
}

async function fetchGhiseul(): Promise<SourceResult> {
  const t0 = Date.now();
  const taxes: GovTax[] = [
    {
      id: "ghis-1", source: "Ghișeul.ro",
      endpoint: "https://api.ghiseul.ro/v2/payer/obligations",
      label: "Taxă judiciară timbru",
      institution: "Ministerul Justiției",
      amount: 50, dueDate: "2026-06-20", status: "due",
      legalRef: "OUG 80/2013",
    },
    {
      id: "ghis-2", source: "Ghișeul.ro",
      endpoint: "https://api.ghiseul.ro/v2/payer/obligations",
      label: "Taxă pașaport — programare",
      institution: "DGP",
      amount: 258, dueDate: "2026-07-02", status: "due",
      legalRef: "OUG 41/2016 anexa 4",
    },
  ];
  return delay(560, { source: "Ghișeul.ro", endpoint: "https://api.ghiseul.ro/v2/payer/obligations", ok: true, fetchedAt: new Date().toISOString(), latencyMs: Date.now() - t0 + 560, taxes });
}

async function fetchPrimarie(): Promise<SourceResult> {
  const t0 = Date.now();
  const taxes: GovTax[] = [
    {
      id: "prim-1", source: "Primărie",
      endpoint: "https://api.primariaclujnapoca.ro/taxe/cetatean",
      label: "Impozit clădire 2026 — rata 1",
      institution: "Primăria Cluj-Napoca",
      amount: 184, dueDate: "2026-06-30", status: "due",
      legalRef: "Cod fiscal art. 461",
    },
    {
      id: "prim-2", source: "Primărie",
      endpoint: "https://api.primariaclujnapoca.ro/taxe/cetatean",
      label: "Impozit auto 2026",
      institution: "Primăria Cluj-Napoca",
      amount: 92, dueDate: "2026-06-04", status: "due",
      legalRef: "Cod fiscal art. 470",
    },
  ];
  return delay(300, { source: "Primărie", endpoint: "https://api.primariaclujnapoca.ro/taxe/cetatean", ok: true, fetchedAt: new Date().toISOString(), latencyMs: Date.now() - t0 + 300, taxes });
}

async function fetchDrpciv(): Promise<SourceResult> {
  const t0 = Date.now();
  const taxes: GovTax[] = [
    {
      id: "drp-1", source: "DRPCIV",
      endpoint: "https://api.drpciv.ro/v1/amenzi",
      label: "Amendă circulație — depășire viteză",
      institution: "IPJ Cluj",
      amount: 290, dueDate: "2026-05-15", status: "overdue",
      legalRef: "OUG 195/2002 art. 102",
    },
  ];
  return delay(380, { source: "DRPCIV", endpoint: "https://api.drpciv.ro/v1/amenzi", ok: true, fetchedAt: new Date().toISOString(), latencyMs: Date.now() - t0 + 380, taxes });
}

async function fetchCnas(): Promise<SourceResult> {
  const t0 = Date.now();
  return delay(220, { source: "CNAS", endpoint: "https://api.cnas.ro/v1/contributii", ok: true, fetchedAt: new Date().toISOString(), latencyMs: Date.now() - t0 + 220, taxes: [] });
}

export type AggregatedTaxes = {
  taxes: GovTax[];
  sources: SourceResult[];
  totalDue: number;
  totalOverdue: number;
  fetchedAt: string;
};

/** Simulate a parallel fan-out call to all sources, like a real BFF aggregator. */
export async function fetchAllTaxes(): Promise<AggregatedTaxes> {
  const results = await Promise.all([
    fetchAnaf(),
    fetchGhiseul(),
    fetchPrimarie(),
    fetchDrpciv(),
    fetchCnas(),
  ]);
  const taxes = results.flatMap((r) => r.taxes);
  const totalDue = taxes.filter((t) => t.status === "due").reduce((s, t) => s + t.amount, 0);
  const totalOverdue = taxes.filter((t) => t.status === "overdue").reduce((s, t) => s + t.amount, 0);
  return { taxes, sources: results, totalDue, totalOverdue, fetchedAt: new Date().toISOString() };
}
