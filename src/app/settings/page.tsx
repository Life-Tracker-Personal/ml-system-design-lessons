"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MonitorIcon,
  GlobeIcon,
  CheckIcon,
  LogOutIcon,
  ZapIcon,
  ShieldAlertIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { models, type Model } from "@/lib/llm/models";
import {
  loadSettings,
  patchSettings,
  clearOpenRouterKey,
  type LLMSettings,
} from "@/lib/llm/settings";
import { startOAuthFlow, exchangeCode } from "@/lib/llm/openrouter";
import { cn } from "@/lib/utils";

type ConnState =
  | { phase: "idle" }
  | { phase: "exchanging" }
  | { phase: "error"; message: string };

export default function SettingsPage() {
  // `null` until mounted so we never render server/client-mismatched storage.
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [conn, setConn] = useState<ConnState>({ phase: "idle" });

  const update = useCallback((patch: Partial<LLMSettings>) => {
    setSettings((prev) => {
      const base = prev ?? loadSettings();
      patchSettings(patch);
      return { ...base, ...patch };
    });
  }, []);

  // Initial load (client-only, reads localStorage).
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Perform the OpenRouter code→key exchange. Shared by the same-tab
  // (?or_code=) and popup (postMessage) return paths. Errors are surfaced,
  // never swallowed — this is what previously left the UI stuck on
  // "not connected" after a successful authorize.
  const runExchange = useCallback(
    async (code: string) => {
      setConn({ phase: "exchanging" });
      try {
        const key = await exchangeCode(code);
        update({ openrouterKey: key });
        setConn({ phase: "idle" });
      } catch (err) {
        setConn({
          phase: "error",
          message: err instanceof Error ? err.message : "Key exchange failed.",
        });
      }
    },
    [update],
  );

  // Same-tab return: the callback redirected here with ?or_code=... Read it,
  // exchange, then strip it from the URL so a refresh can't re-run it.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("or_code");
    if (!code) return;
    url.searchParams.delete("or_code");
    window.history.replaceState(null, "", url.pathname + url.search);
    runExchange(code);
  }, [runExchange]);

  // Popup return path (kept as a fallback if the flow ever runs in a popup).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "openrouter-code") return;
      runExchange(e.data.code as string);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [runExchange]);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to lessons
      </Link>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Configure the tutor: pick a provider, connect your OpenRouter account,
        and choose a model.
      </p>

      {settings === null ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Mode */}
          <section>
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Provider
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={settings.mode === "openrouter"}
                onClick={() => update({ mode: "openrouter" })}
                icon={<GlobeIcon className="size-4" />}
                label="OpenRouter"
                sub="API (cloud) — works on any device"
              />
              <ModeButton
                active={settings.mode === "local"}
                onClick={() => update({ mode: "local" })}
                icon={<MonitorIcon className="size-4" />}
                label="Local Bridge"
                sub="Claude CLI — same machine only"
              />
            </div>
            {settings.mode === "local" && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                Local Bridge only works in a browser on the same computer that
                runs <code className="font-mono">claude-bridge</code>. On a phone,
                use OpenRouter.
              </p>
            )}
          </section>

          {/* OpenRouter account */}
          {settings.mode === "openrouter" && (
            <section>
              <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                OpenRouter account
              </h2>
              {settings.openrouterKey ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-3">
                  <span className="flex items-center gap-2 text-sm">
                    <CheckIcon className="size-4 text-green-600 dark:text-green-400" />
                    Connected
                  </span>
                  <button
                    onClick={() => {
                      clearOpenRouterKey();
                      update({ openrouterKey: null });
                      setConn({ phase: "idle" });
                    }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <LogOutIcon className="size-3" />
                    Disconnect &amp; delete key
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setConn({ phase: "idle" });
                      startOAuthFlow();
                    }}
                    disabled={conn.phase === "exchanging"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-primary px-3.5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-5"
                  >
                    {conn.phase === "exchanging" ? (
                      <>
                        <LoaderCircleIcon className="size-4 animate-spin" />
                        Finishing sign-in…
                      </>
                    ) : (
                      "Connect OpenRouter →"
                    )}
                  </button>
                  {conn.phase === "error" && (
                    <p className="flex items-start gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                      <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                      {conn.message}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Bridge port */}
          {settings.mode === "local" && (
            <section>
              <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Bridge port
              </h2>
              <input
                type="number"
                min={1024}
                max={65535}
                value={settings.bridgePort}
                onChange={(e) =>
                  update({ bridgePort: parseInt(e.target.value, 10) || 8787 })
                }
                className="w-full max-w-[12rem] rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums focus:border-ring focus:ring-2 focus:ring-ring/50 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                The port your local claude-bridge is running on (default 8787).
              </p>
            </section>
          )}

          {/* Model */}
          {settings.mode === "openrouter" && (
            <section>
              <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Model
              </h2>
              <div className="space-y-3">
                {groupByProvider(models).map(([provider, items]) => (
                  <div key={provider}>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
                      {provider}
                    </p>
                    <div className="space-y-1">
                      {items.map((m) => (
                        <ModelRow
                          key={m.id}
                          model={m}
                          selected={settings.modelId === m.id}
                          onSelect={() => update({ modelId: m.id })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Security disclosure */}
          <section className="rounded-lg border border-border bg-muted/30 p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <ShieldAlertIcon className="size-3.5" />
              Where is my key stored?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your OpenRouter key is stored in this browser&apos;s{" "}
              <code className="font-mono">localStorage</code> on this device only —
              it is never sent to our servers. That means it is{" "}
              <strong>not encrypted at rest</strong> and any script running on
              this origin could read it, so treat it like a password: use
              &ldquo;Disconnect &amp; delete key&rdquo; on shared computers, and
              set a spend limit on your OpenRouter key. For stronger isolation we
              plan a server-side proxy that keeps the key in an httpOnly cookie
              so page scripts can never read it.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center text-sm transition-colors",
        active
          ? "border-primary/40 bg-primary/8 text-foreground"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span className="text-[11px] text-muted-foreground">{sub}</span>
    </button>
  );
}

function ModelRow({
  model,
  selected,
  onSelect,
}: {
  model: Model;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        selected
          ? "bg-primary/8 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      >
        {selected && <CheckIcon className="size-2.5 text-primary-foreground" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{model.name}</span>
          {model.tier === "free" && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-px text-[10px] font-medium text-green-700 dark:text-green-400">
              <ZapIcon className="size-2.5" />
              free
            </span>
          )}
        </span>
        <span className="block text-xs text-muted-foreground">
          {model.description}
        </span>
      </span>
    </button>
  );
}

function groupByProvider(items: Model[]): [string, Model[]][] {
  const map = new Map<string, Model[]>();
  for (const m of items) {
    const list = map.get(m.provider) ?? [];
    list.push(m);
    map.set(m.provider, list);
  }
  return [...map.entries()];
}
