export default function Loading() {
  return (
    <div className="flex-1 p-6 md:p-12 space-y-8 animate-pulse bg-[#070913] min-h-screen text-slate-400">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/20">
        <div className="space-y-2.5">
          <div className="h-6 w-48 bg-slate-800/50 rounded-lg"></div>
          <div className="h-3.5 w-32 bg-slate-800/30 rounded-lg"></div>
        </div>
        <div className="h-9 w-32 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"></div>
      </div>

      {/* Stats Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 bg-[#0C0E1A] border border-slate-800/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-800/40 rounded-lg"></div>
              <div className="w-8 h-8 rounded-xl bg-slate-900/60 border border-slate-800/50"></div>
            </div>
            <div className="h-7 w-32 bg-slate-800/50 rounded-lg"></div>
            <div className="h-3 w-40 bg-slate-800/30 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-[#0C0E1A] border border-slate-800/30 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 bg-slate-800/40 rounded-lg"></div>
            <div className="h-3 w-16 bg-slate-800/30 rounded-lg"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800/40"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-800/40 rounded-lg"></div>
                    <div className="h-2.5 w-20 bg-slate-800/30 rounded-lg"></div>
                  </div>
                </div>
                <div className="h-4.5 w-16 bg-slate-800/40 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-[#0C0E1A] border border-slate-800/30 rounded-2xl space-y-6">
          <div className="h-5 w-32 bg-slate-800/40 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-36 bg-slate-900/40 border border-slate-800/50 rounded-xl flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin"></div>
            </div>
            <div className="space-y-2.5">
              <div className="h-3.5 w-full bg-slate-800/40 rounded-lg"></div>
              <div className="h-3.5 w-5/6 bg-slate-800/40 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
