/**
 * SkeletonLoader — replaces loading spinners across all data-fetching pages.
 * type: 'list' | 'card' | 'table' | 'kpi' | 'form'
 * rows: number of skeleton rows to render (default varies by type)
 */
const SkeletonLoader = ({ type = 'list', rows }) => {
  const defaultRows = { list: 5, card: 3, table: 6, kpi: 4, form: 4 };
  const count = rows ?? defaultRows[type] ?? 4;

  if (type === 'kpi') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon bg-dark-700/60 skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-dark-700/60 skeleton" />
              <div className="h-6 w-16 rounded bg-dark-700/60 skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-dark-700/60 skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-dark-700/60 skeleton" />
                <div className="h-3 w-20 rounded bg-dark-700/60 skeleton" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-dark-700/60 skeleton" />
              <div className="h-3 w-3/4 rounded bg-dark-700/60 skeleton" />
            </div>
            <div className="h-9 w-full rounded-xl bg-dark-700/60 skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-card overflow-hidden animate-pulse">
        {/* Header */}
        <div className="p-4 border-b border-dark-700/50 flex gap-4">
          <div className="h-4 w-24 rounded bg-dark-700/60 skeleton" />
          <div className="h-4 w-16 rounded bg-dark-700/60 skeleton" />
          <div className="h-4 w-20 rounded bg-dark-700/60 skeleton" />
          <div className="h-4 w-16 rounded bg-dark-700/60 skeleton ml-auto" />
        </div>
        {/* Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-dark-700/30">
            <div className="w-10 h-10 rounded-xl bg-dark-700/60 skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-dark-700/60 skeleton" />
              <div className="h-3 w-24 rounded bg-dark-700/60 skeleton" />
            </div>
            <div className="h-6 w-16 rounded-full bg-dark-700/60 skeleton" />
            <div className="h-8 w-20 rounded-lg bg-dark-700/60 skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="glass-card p-6 space-y-5 animate-pulse max-w-lg">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-dark-700/60 skeleton" />
            <div className="h-11 w-full rounded-xl bg-dark-700/60 skeleton" />
          </div>
        ))}
        <div className="h-11 w-full rounded-xl bg-primary-900/40 skeleton mt-4" />
      </div>
    );
  }

  // Default: list type
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-dark-700/30">
          <div className="w-10 h-10 rounded-xl bg-dark-700/60 skeleton flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded bg-dark-700/60 skeleton" style={{ width: `${55 + (i * 17) % 35}%` }} />
            <div className="h-3 rounded bg-dark-700/60 skeleton" style={{ width: `${35 + (i * 13) % 30}%` }} />
          </div>
          <div className="h-6 w-16 rounded-full bg-dark-700/60 skeleton flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
