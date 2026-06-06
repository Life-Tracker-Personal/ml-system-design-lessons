export function Quiz({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={`q${id}`}
      className="my-8 scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-7"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-semibold text-primary tabular-nums">
          {id}
        </span>
        <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Question {id}
        </span>
      </div>
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </div>
  );
}
