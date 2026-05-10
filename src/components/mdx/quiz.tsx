import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Quiz({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="my-8 border-l-4 border-l-primary/60">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline">Quiz</Badge>
          <span className="text-muted-foreground font-mono text-xs">{id}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
