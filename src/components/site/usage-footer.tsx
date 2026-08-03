"use client";

import { useEffect, useState } from "react";
import { WalletIcon } from "lucide-react";
import {
  formatCost,
  formatTokens,
  getKeyUsage,
  type KeyUsage,
  type Usage,
} from "@/lib/llm/usage";
import { loadSettings } from "@/lib/llm/settings";

/** Per-response tokens/cost, shown under each assistant message. */
export function UsageFooter({ usage, model }: { usage?: Usage; model?: string }) {
  if (!usage) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground/80">
      <span title={`${formatTokens(usage.promptTokens)} in · ${formatTokens(usage.completionTokens)} out`}>
        {formatTokens(usage.totalTokens)} tokens
      </span>
      {usage.cost !== undefined && (
        <>
          <span aria-hidden>·</span>
          <span>{formatCost(usage.cost)}</span>
        </>
      )}
      {model && (
        <>
          <span aria-hidden>·</span>
          <span className="truncate">{model}</span>
        </>
      )}
    </p>
  );
}

/** Session total + account spend, shown in the chat header. */
export function SpendHeader({ sessionUsage }: { sessionUsage?: Usage }) {
  const [key, setKey] = useState<KeyUsage | null>(null);
  const [mode, setMode] = useState<"openrouter" | "local">("openrouter");

  useEffect(() => {
    const s = loadSettings();
    setMode(s.mode);
    if (s.mode !== "openrouter" || !s.openrouterKey) return;
    let cancelled = false;
    getKeyUsage(s.openrouterKey).then((u) => {
      if (!cancelled) setKey(u);
    });
    return () => {
      cancelled = true;
    };
    // Re-read after each response so spend reflects the latest call.
  }, [sessionUsage?.totalTokens]);

  // The local bridge spends Claude-subscription usage, not OpenRouter credit:
  // there is no cost figure to show.
  if (mode === "local") return null;
  if (!key && !sessionUsage) return null;

  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <WalletIcon className="size-3" />
      {sessionUsage && (
        <span>
          this chat {formatTokens(sessionUsage.totalTokens)} tok
          {sessionUsage.cost !== undefined && ` · ${formatCost(sessionUsage.cost)}`}
        </span>
      )}
      {key && (
        <span className="text-muted-foreground/70">
          {sessionUsage ? "· " : ""}
          {key.limit === null
            ? `${formatCost(key.usage)} used`
            : `${formatCost(key.usage)} / ${formatCost(key.limit)}`}
        </span>
      )}
    </p>
  );
}
