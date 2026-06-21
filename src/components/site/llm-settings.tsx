"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SettingsIcon,
  XIcon,
  MonitorIcon,
  GlobeIcon,
  CheckIcon,
  LogOutIcon,
  ZapIcon,
} from "lucide-react";
import { models, type Model } from "@/lib/llm/models";
import {
  loadSettings,
  patchSettings,
  type LLMSettings,
} from "@/lib/llm/settings";
import { startOAuthFlow, exchangeCode } from "@/lib/llm/openrouter";
import { cn } from "@/lib/utils";

export function LLMSettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="LLM settings"
        title="LLM settings"
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <SettingsIcon className="size-[1.05rem]" />
      </button>
      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<LLMSettings>(loadSettings);

  const update = useCallback((patch: Partial<LLMSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      patchSettings(patch);
      return next;
    });
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "openrouter-code") return;
      exchangeCode(e.data.code).then((key) => {
        update({ openrouterKey: key });
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [update]);

  useEffect(() => {
    const pending = localStorage.getItem("or-pending-code");
    if (pending) {
      localStorage.removeItem("or-pending-code");
      exchangeCode(pending).then((key) => update({ openrouterKey: key }));
    }
  }, [update]);

  const isConnected = !!settings.openrouterKey;
  const grouped = groupByProvider(models);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
      <div className="relative mt-14 mr-4 flex w-[360px] max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl sm:mr-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">LLM Settings</h2>
          <button
            onClick={onClose}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Mode toggle */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mode
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={settings.mode === "openrouter"}
                onClick={() => update({ mode: "openrouter" })}
                icon={<GlobeIcon className="size-4" />}
                label="OpenRouter"
                sub="API (cloud)"
              />
              <ModeButton
                active={settings.mode === "local"}
                onClick={() => update({ mode: "local" })}
                icon={<MonitorIcon className="size-4" />}
                label="Local Bridge"
                sub="Claude CLI"
              />
            </div>
          </fieldset>

          {/* OpenRouter connection */}
          {settings.mode === "openrouter" && (
            <fieldset>
              <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                OpenRouter Account
              </legend>
              {isConnected ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <CheckIcon className="size-3.5 text-green-600 dark:text-green-400" />
                    Connected
                  </span>
                  <button
                    onClick={() => update({ openrouterKey: null })}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <LogOutIcon className="size-3" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startOAuthFlow()}
                  className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Connect OpenRouter →
                </button>
              )}
            </fieldset>
          )}

          {/* Bridge port */}
          {settings.mode === "local" && (
            <fieldset>
              <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bridge Port
              </legend>
              <input
                type="number"
                min={1024}
                max={65535}
                value={settings.bridgePort}
                onChange={(e) =>
                  update({ bridgePort: parseInt(e.target.value, 10) || 8787 })
                }
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums focus:border-ring focus:ring-2 focus:ring-ring/50 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                The port your local claude-bridge is running on.
              </p>
            </fieldset>
          )}

          {/* Model selector */}
          {settings.mode === "openrouter" && (
            <fieldset>
              <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Model
              </legend>
              <div className="space-y-3">
                {grouped.map(([provider, items]) => (
                  <div key={provider}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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
            </fieldset>
          )}
        </div>
      </div>
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
        "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-sm transition-colors",
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
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{model.name}</span>
          {model.tier === "free" && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-px text-[10px] font-medium text-green-700 dark:text-green-400">
              <ZapIcon className="size-2.5" />
              free
            </span>
          )}
        </span>
        <span className="block text-xs text-muted-foreground">{model.description}</span>
      </span>
    </button>
  );
}

function groupByProvider(items: Model[]): [string, Model[]][] {
  const map = new Map<string, Model[]>();
  for (const m of items) {
    const key = m.provider;
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  return [...map.entries()];
}
