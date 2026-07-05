import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn('space-y-1', className)}>
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {hint && <p className="text-xs text-white/40">{hint}</p>}
    </Card>
  );
}
