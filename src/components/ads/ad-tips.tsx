import { Card } from "@/components/ui/card";

interface AdTipsProps {
  tips: string[];
}

export function AdTips({ tips }: AdTipsProps) {
  if (!tips.length) return null;

  return (
    <Card variant="highlighted">
      <h3 className="text-sm font-semibold text-primary mb-3">Tips de optimizacion</h3>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="text-sm text-text-secondary flex gap-2">
            <span className="text-primary mt-0.5">*</span>
            {tip}
          </li>
        ))}
      </ul>
    </Card>
  );
}
