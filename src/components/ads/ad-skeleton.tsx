import { cn } from "@/lib/utils";

interface AdSkeletonProps {
  count?: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("bg-surface animate-pulse rounded", className)} />;
}

export function AdSkeleton({ count = 3 }: AdSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-4 w-12" />
          </div>
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-6 w-full" />
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}
