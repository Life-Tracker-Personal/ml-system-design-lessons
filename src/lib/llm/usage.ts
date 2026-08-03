/**
 * Token and cost accounting for the tutor.
 *
 * OpenRouter returns a `usage` object on every completion, and reports the
 * real dollar cost when the request opts in with `usage: { include: true }`.
 * We were discarding all of it, so there was no way to see what a question
 * cost. This module parses that payload and reads account-level spend.
 */

const KEY_URL = "https://openrouter.ai/api/v1/auth/key";

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** USD, when OpenRouter reports it (requires usage accounting enabled). */
  cost?: number;
}

/** Account spend for the connected key. */
export interface KeyUsage {
  /** USD spent on this key so far. */
  usage: number;
  /** Credit limit in USD, or null when the key is uncapped. */
  limit: number | null;
  /** Remaining USD, when a limit exists. */
  remaining: number | null;
  isFreeTier: boolean;
}

/** Parse the `usage` block of a completion response. Tolerant of absences. */
export function parseUsage(raw: unknown): Usage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const num = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? v : 0;

  const promptTokens = num(u.prompt_tokens);
  const completionTokens = num(u.completion_tokens);
  const totalTokens = num(u.total_tokens) || promptTokens + completionTokens;
  if (!promptTokens && !completionTokens && !totalTokens) return undefined;

  const cost =
    typeof u.cost === "number" && Number.isFinite(u.cost) ? u.cost : undefined;

  return { promptTokens, completionTokens, totalTokens, cost };
}

/** Account-level spend/credits for the connected key. */
export async function getKeyUsage(apiKey: string): Promise<KeyUsage | null> {
  try {
    const resp = await fetch(KEY_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) return null;
    const body = await resp.json();
    const d = body?.data ?? {};
    const usage = typeof d.usage === "number" ? d.usage : 0;
    const limit = typeof d.limit === "number" ? d.limit : null;
    return {
      usage,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - usage),
      isFreeTier: !!d.is_free_tier,
    };
  } catch {
    return null;
  }
}

/** "$0.0021" / "<$0.0001" / "$1.23" — small costs need more precision. */
export function formatCost(cost: number): string {
  if (cost <= 0) return "$0";
  if (cost < 0.0001) return "<$0.0001";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/** "1,203" */
export function formatTokens(n: number): string {
  return n.toLocaleString("en-US");
}

/** Sum of per-message usage for a session total. */
export function sumUsage(items: (Usage | undefined)[]): Usage | undefined {
  const present = items.filter((u): u is Usage => !!u);
  if (present.length === 0) return undefined;
  return present.reduce<Usage>(
    (acc, u) => ({
      promptTokens: acc.promptTokens + u.promptTokens,
      completionTokens: acc.completionTokens + u.completionTokens,
      totalTokens: acc.totalTokens + u.totalTokens,
      cost:
        u.cost === undefined && acc.cost === undefined
          ? undefined
          : (acc.cost ?? 0) + (u.cost ?? 0),
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: undefined },
  );
}
