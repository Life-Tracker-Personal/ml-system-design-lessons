"use client";

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
    <Accordion className="my-6 rounded-lg border">
      <AccordionItem value={id} className="border-0">
        <AccordionTrigger className="px-4 hover:no-underline">
          <span className="text-left font-semibold">{title}</span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
