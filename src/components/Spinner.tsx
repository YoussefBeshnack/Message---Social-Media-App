export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-sm font-semibold text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-100 border-t-leaf" />
      <span>{label}</span>
    </div>
  );
}
