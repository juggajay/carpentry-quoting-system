export default function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-neutral-800 rounded" />
          <div className="h-4 w-32 bg-neutral-800 rounded" />
        </div>
        <div className="h-6 w-16 bg-neutral-800 rounded-full" />
      </div>
      
      <div className="space-y-3">
        <div className="h-4 w-full bg-neutral-800 rounded" />
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-neutral-800 rounded" />
          <div className="h-4 w-16 bg-neutral-800 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-neutral-800 rounded" />
          <div className="h-6 w-24 bg-neutral-800 rounded" />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-700">
        <div className="h-3 w-24 bg-neutral-800 rounded" />
        <div className="h-8 w-20 bg-neutral-800 rounded" />
      </div>
    </div>
  );
}