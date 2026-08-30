function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />;
}

/** Public list pages (Events, Members, News): navy header + card grid. */
export function ListPageSkeleton({ cards = 9 }: { cards?: number }) {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="bg-navy-900 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Shimmer className="h-3 w-32 bg-white/10 mb-4" />
          <Shimmer className="h-9 w-72 max-w-full bg-white/10 mb-3" />
          <Shimmer className="h-4 w-96 max-w-full bg-white/10" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white border border-slate-100">
              <Shimmer className="h-36 rounded-none" />
              <div className="p-5 space-y-3">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Public detail pages (Event/Member/News detail): navy header + cover + content/sidebar. */
export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="bg-navy-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Shimmer className="h-3 w-24 bg-white/10 mb-6" />
          <Shimmer className="h-4 w-32 bg-white/10 mb-4" />
          <Shimmer className="h-9 w-2/3 max-w-full bg-white/10 mb-3" />
          <Shimmer className="h-4 w-1/2 max-w-full bg-white/10" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <Shimmer className="h-64 sm:h-80 rounded-2xl" />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            <Shimmer className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simpler public pages (Meetings, Committee History): navy header + stacked content blocks. */
export function SimplePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-800 pt-28 pb-14">
        <div className="container-max px-6">
          <Shimmer className="h-3 w-40 bg-white/10 mb-4" />
          <Shimmer className="h-9 w-80 max-w-full bg-white/10 mb-4" />
          <Shimmer className="h-4 w-2/3 max-w-full bg-white/10" />
        </div>
      </div>
      <div className="container-max px-6 py-12 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
