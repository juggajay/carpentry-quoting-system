export default function SkeletonCard() {
  return (
    <div className="bg-dark-elevated border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-dark-surface rounded" />
          <div className="h-4 w-32 bg-dark-surface rounded" />
        </div>
        <div className="h-6 w-16 bg-dark-surface rounded-full" />
      </div>
      
      <div className="space-y-3">
        <div className="h-4 w-full bg-dark-surface rounded" />
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-dark-surface rounded" />
          <div className="h-4 w-16 bg-dark-surface rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-dark-surface rounded" />
          <div className="h-6 w-24 bg-dark-surface rounded" />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700">
        <div className="h-3 w-24 bg-dark-surface rounded" />
        <div className="h-8 w-20 bg-dark-surface rounded" />
      </div>
    </div>
  );
}