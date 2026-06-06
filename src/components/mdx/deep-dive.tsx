"use client";

import { TelescopeIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function DeepDive({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = title.replace(/\W+/g, "-").toLowerCase();
  return (
    <Accordion className="my-6 overflow-hidden rounded-xl border border-border bg-card">
      <AccordionItem value={id} className="border-0">
        <AccordionTrigger className="gap-3 px-5 py-4 hover:bg-accent/40 hover:no-underline">
          <span className="flex items-start gap-3 text-left">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TelescopeIcon className="size-4" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-primary uppercase">
                Deep dive
              </span>
              <span className="font-semibold tracking-tight">{title}</span>
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
