"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircleIcon,
  SendIcon,
  XIcon,
  Trash2Icon,
  LoaderCircleIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ask } from "@/lib/llm/client";
import { loadSettings } from "@/lib/llm/settings";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export function TutorWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask the tutor"
        className={cn(
          "fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:right-6 sm:bottom-6",
          open && "hidden",
        )}
      >
        <MessageCircleIcon className="size-4" />
        Ask
      </button>
      {open && <TutorPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function TutorPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = useCallback(async () => {
    const query = input.trim();
    if (!query || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: query }]);
    setBusy(true);
    try {
      const result = await ask(query, sessionRef.current);
      if (!result.isError) sessionRef.current = result.sessionId;
      setMessages((m) => [
        ...m,
        { role: "assistant", content: result.text, isError: result.isError },
      ]);
    } catch {
      const { mode, bridgePort } = loadSettings();
      const hint =
        mode === "local"
          ? `Couldn't reach the local bridge on port ${bridgePort}. The bridge only works in a browser on the same machine where \`claude-bridge\` is running — on a phone, switch to **OpenRouter** mode in Settings (gear icon, top right).`
          : "The request failed. Check your connection and OpenRouter settings (gear icon, top right), then try again.";
      setMessages((m) => [...m, { role: "assistant", content: hint, isError: true }]);
    } finally {
      setBusy(false);
    }
  }, [input, busy]);

  const clear = useCallback(() => {
    setMessages([]);
    sessionRef.current = undefined;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-6">
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />
      <div className="relative flex h-[80dvh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-popover shadow-xl sm:h-[min(600px,calc(100dvh-6rem))] sm:w-[400px] sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircleIcon className="size-4 text-primary" />
            Tutor
          </h2>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clear}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <MessageCircleIcon className="size-8 opacity-40" />
              <p className="max-w-[24ch]">
                Ask anything about the lesson you&apos;re reading — derivations,
                gotchas, rapid-fire answers.
              </p>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="ml-8 rounded-xl rounded-br-sm bg-primary/10 px-3.5 py-2.5 text-sm whitespace-pre-wrap"
              >
                {m.content}
              </div>
            ) : (
              <div
                key={i}
                className={cn(
                  "tutor-answer mr-2 text-sm leading-relaxed",
                  m.isError && "rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5",
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask the tutor…"
              className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:border-ring focus:ring-2 focus:ring-ring/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <SendIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
