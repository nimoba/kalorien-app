// Shared OpenAI helper (Chat Completions API).
// Models can be overridden via env without code changes.

/** Accurate estimates (food text, photos, barcode fallback, sport). */
export const MODEL_PRECISE = process.env.OPENAI_MODEL_PRECISE || "gpt-5.4";
/** Cheaper, fast model for free-text generation (recipes, plans, analyses). */
export const MODEL_FAST = process.env.OPENAI_MODEL_FAST || "gpt-5.4-mini";

type ReasoningEffort = "none" | "low" | "medium" | "high";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

export interface ChatMessage {
  role: "system" | "developer" | "user" | "assistant";
  content: string | ContentPart[];
}

interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  /** Reasoning effort; sampling params like temperature only apply with "none". */
  reasoning?: ReasoningEffort;
  temperature?: number;
  maxTokens?: number;
  /** JSON schema for structured outputs (strict), or "object" for free JSON mode. */
  json?: { name: string; schema: Record<string, unknown> } | "object";
}

export class OpenAIError extends Error {
  constructor(message: string, public status?: number, public details?: string) {
    super(message);
  }
}

export async function chat({ model = MODEL_FAST, messages, reasoning = "none", temperature, maxTokens, json }: ChatOptions): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new OpenAIError("OPENAI_API_KEY nicht konfiguriert");

  const body: Record<string, unknown> = { model, messages, reasoning_effort: reasoning };
  if (temperature !== undefined && reasoning === "none") body.temperature = temperature;
  if (maxTokens) body.max_completion_tokens = maxTokens;
  if (json === "object") body.response_format = { type: "json_object" };
  else if (json) body.response_format = { type: "json_schema", json_schema: { name: json.name, strict: true, schema: json.schema } };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`OpenAI ${model} Fehler ${res.status}:`, text);
    throw new OpenAIError(res.status === 401 ? "Ungültiger OpenAI API Key" : `OpenAI Fehler (${res.status})`, res.status, text.slice(0, 500));
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (choice?.message?.refusal) throw new OpenAIError(`Anfrage abgelehnt: ${choice.message.refusal}`);
  const content: string | undefined = choice?.message?.content;
  if (!content) throw new OpenAIError(`Leere Antwort (finish_reason: ${choice?.finish_reason ?? "unbekannt"})`);
  return content;
}

export async function chatJSON<T>(opts: ChatOptions & { json: NonNullable<ChatOptions["json"]> }): Promise<T> {
  const content = await chat(opts);
  try {
    return JSON.parse(content.replace(/```json|```/g, "").trim()) as T;
  } catch {
    throw new OpenAIError("Antwort war kein gültiges JSON", undefined, content.slice(0, 300));
  }
}

// ---------------------------------------------------------------------------
// Food estimation (shared by text and photo endpoints)
// ---------------------------------------------------------------------------

export type FoodUnit = "g" | "ml" | "Stück" | "Portion";

export interface FoodComponent {
  name: string;
  gramm: number;
  kcal_100g: number;
  eiweiss_100g: number;
  fett_100g: number;
  kh_100g: number;
}

export interface FoodEstimateRaw {
  name: string;
  unit: FoodUnit;
  menge: number;
  komponenten: FoodComponent[];
}

export const FOOD_SCHEMA = {
  name: "lebensmittel_schaetzung",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["name", "unit", "menge", "komponenten"],
    properties: {
      name: { type: "string", description: "Kurzer deutscher Name des Gerichts/Lebensmittels" },
      unit: { type: "string", enum: ["g", "ml", "Stück", "Portion"] },
      menge: { type: "number", description: "Verzehrte Menge in der gewählten Einheit" },
      komponenten: {
        type: "array",
        description: "Einzelne Bestandteile mit Gewicht und Nährwerten pro 100 g laut Nährwerttabelle",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "gramm", "kcal_100g", "eiweiss_100g", "fett_100g", "kh_100g"],
          properties: {
            name: { type: "string" },
            gramm: { type: "number", description: "Verzehrtes Gewicht dieses Bestandteils in g (ml ≈ g)" },
            kcal_100g: { type: "number" },
            eiweiss_100g: { type: "number" },
            fett_100g: { type: "number" },
            kh_100g: { type: "number" },
          },
        },
      },
    },
  },
};

export const FOOD_RULES = `
Vorgehen:
1. Zerlege die Mahlzeit in ihre Bestandteile (z. B. "2 Eier und Toast mit Butter" → Ei, Toastbrot, Butter). Ein einzelnes Lebensmittel ist eine Komponente.
2. Schätze für jeden Bestandteil das verzehrte Gewicht in Gramm. Nutze realistische Standardgewichte (z. B. Ei M ≈ 58 g essbar, Scheibe Toast ≈ 25 g, Apfel ≈ 170 g, TL Butter ≈ 5 g, EL Öl ≈ 10 g). Explizite Mengenangaben des Nutzers exakt übernehmen.
3. Gib je Bestandteil die Nährwerte pro 100 g so an, wie sie in Nährwerttabellen stehen (BLS, USDA, typische Verpackungsangaben in Deutschland). Keine gerundeten Fantasiewerte – z. B. Ei 137 kcal, Toastbrot 260 kcal, Butter 741 kcal pro 100 g.
4. Vergiss versteckte Kalorien nicht (Öl/Butter beim Braten, Soßen, Dressing), wenn sie typisch sind.
5. Kalorien müssen zu den Makros passen (≈ 4 kcal/g Eiweiß und KH, 9 kcal/g Fett).

Einheit wählen:
- Der Nutzer nennt Stückzahl (z. B. "2 Äpfel", "3 Eier") → unit "Stück", menge = Anzahl.
- Gericht/Portion ohne Gewichtsangabe (z. B. "Teller Spaghetti Bolognese") → unit "Portion", menge = Anzahl Portionen.
- Gewicht/Volumen angegeben → unit "g" bzw. "ml", menge = genannte Menge.
Rechne NICHT selbst Summen aus – die Gesamtwerte werden aus den Komponenten berechnet.`;

export interface FoodEstimate {
  name: string;
  unit: FoodUnit;
  menge: number;
  unitWeight?: number;
  /** Per 100 g/ml values (the editor's convention). */
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  /** Totals for the whole eaten amount. */
  gesamt: { gramm: number; kcal: number; eiweiss: number; fett: number; kh: number };
  komponenten: FoodComponent[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Sums components in code so totals are exact instead of model-rounded numbers. */
export function aggregateFood(raw: FoodEstimateRaw): FoodEstimate {
  const komponenten = (raw.komponenten || []).filter((k) => Number(k.gramm) > 0);
  if (komponenten.length === 0) throw new OpenAIError("Keine Bestandteile erkannt");

  const tot = komponenten.reduce(
    (a, k) => {
      const f = Number(k.gramm) / 100;
      return {
        gramm: a.gramm + Number(k.gramm),
        kcal: a.kcal + Number(k.kcal_100g) * f,
        eiweiss: a.eiweiss + Number(k.eiweiss_100g) * f,
        fett: a.fett + Number(k.fett_100g) * f,
        kh: a.kh + Number(k.kh_100g) * f,
      };
    },
    { gramm: 0, kcal: 0, eiweiss: 0, fett: 0, kh: 0 },
  );

  const per100 = (v: number) => r1((v / tot.gramm) * 100);
  let unit: FoodUnit = raw.unit;
  let menge = Number(raw.menge) || 0;
  let unitWeight: number | undefined;

  if (unit === "Stück" || unit === "Portion") {
    if (menge <= 0) menge = 1;
    unitWeight = Math.round(tot.gramm / menge);
  } else {
    // Keep amount consistent with the components the totals were built from
    unit = unit === "ml" ? "ml" : "g";
    menge = Math.round(tot.gramm);
  }

  return {
    name: raw.name,
    unit,
    menge,
    unitWeight,
    kcal: per100(tot.kcal),
    eiweiss: per100(tot.eiweiss),
    fett: per100(tot.fett),
    kh: per100(tot.kh),
    gesamt: { gramm: Math.round(tot.gramm), kcal: Math.round(tot.kcal), eiweiss: r1(tot.eiweiss), fett: r1(tot.fett), kh: r1(tot.kh) },
    komponenten,
  };
}
