export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="mt-1 text-xs text-white/40">{description}</p>
    </div>
  );
}
