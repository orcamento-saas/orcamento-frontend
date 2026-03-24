"use client";

import { Card } from "@/components/ui/Card";

// Componente base de skeleton
function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 rounded ${className ?? ""}`}
    />
  );
}

// Skeleton para página "Meus Orçamentos"
export function MyBudgetsSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header skeleton */}
      <div className="mb-4 shrink-0">
        <SkeletonBase className="h-8 w-64 mb-2" />
        <SkeletonBase className="h-4 w-48" />
      </div>

      {/* Search and filter skeleton */}
      <div className="mb-4 flex shrink-0 flex-wrap gap-2">
        <SkeletonBase className="h-11 w-80 rounded-xl" />
        <SkeletonBase className="h-11 w-32 rounded-xl" />
      </div>

      {/* Budget list skeleton */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 bg-gray-50 border-gray-200">
        <div className="min-h-0 flex-1 overflow-y-auto px-0 py-4 sm:p-4">
          <div className="space-y-2 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-3 sm:gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                    <SkeletonBase className="h-6 w-16 rounded-md" />
                    <SkeletonBase className="h-6 w-24 rounded-md" />
                  </div>
                  <SkeletonBase className="h-5 w-48 mb-1" />
                  <SkeletonBase className="h-4 w-64 mb-1" />
                  <SkeletonBase className="h-4 w-56" />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-5 sm:justify-start sm:gap-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <SkeletonBase key={j} className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Skeleton para página "Novo Orçamento"  
export function CreateBudgetSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row lg:gap-6">
      {/* Desktop layout skeleton */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col">
        <SkeletonBase className="h-8 w-48 mb-6" />
        
        <Card className="flex-1 bg-teal-50 p-6">
          <div className="space-y-6">
            <SkeletonBase className="h-6 w-20 mb-2" />
            <SkeletonBase className="h-11 w-full rounded-xl" />
            
            <div>
              <SkeletonBase className="h-5 w-32 mb-2" />
              <SkeletonBase className="h-20 w-full rounded-xl" />
            </div>
            
            <div>
              <SkeletonBase className="h-5 w-40 mb-2" />
              <div className="flex gap-2">
                <SkeletonBase className="h-10 w-48 rounded-xl" />
                <SkeletonBase className="h-10 w-16" />
                <SkeletonBase className="h-10 w-64 rounded-xl" />
              </div>
            </div>
            
            {/* Items skeleton */}
            <div>
              <SkeletonBase className="h-6 w-32 mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-4 p-4 bg-white rounded-lg border">
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <SkeletonBase className="h-11 col-span-2 rounded-xl" />
                    <SkeletonBase className="h-11 rounded-xl" />
                    <SkeletonBase className="h-11 rounded-xl" />
                  </div>
                  <div className="flex justify-between items-center">
                    <SkeletonBase className="h-4 w-32" />
                    <SkeletonBase className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
              <SkeletonBase className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile layout skeleton */}
      <div className="flex lg:hidden flex-col h-full overflow-hidden">
        <SkeletonBase className="h-8 w-48 mb-4 mx-4" />
        
        {/* Mobile navigation buttons skeleton */}
        <div className="mb-4 flex gap-2 px-4 shrink-0">
          <SkeletonBase className="h-10 flex-1 rounded-lg" />
          <SkeletonBase className="h-10 flex-1 rounded-lg" />
        </div>

        {/* Mobile form content skeleton */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <Card className="h-fit bg-teal-50 p-6">
            <div className="space-y-6">
              <div>
                <SkeletonBase className="h-5 w-16 mb-2" />
                <SkeletonBase className="h-11 w-full rounded-xl" />
              </div>
              
              <div>
                <SkeletonBase className="h-5 w-32 mb-2" />
                <SkeletonBase className="h-20 w-full rounded-xl" />
              </div>
              
              {/* More mobile form fields */}
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <SkeletonBase className="h-5 w-28 mb-2" />
                  <SkeletonBase className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Desktop preview skeleton */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col">
        <SkeletonBase className="h-8 w-32 mb-6" />
        <Card className="flex-1 bg-white">
          <SkeletonBase className="h-full w-full rounded-lg" />
        </Card>
      </div>
    </div>
  );
}

/** Skeleton da página Agendados (filtros + calendário + lista) */
export function AgendadosSkeleton() {
  return (
    <div className="h-full overflow-y-auto pb-4 pr-1">
      <div className="space-y-3">
        <SkeletonBase className="mx-auto h-8 w-48 sm:mx-0" />
        <SkeletonBase className="mx-auto h-4 w-72 max-w-full sm:mx-0" />
        <Card className="rounded-3xl border-zinc-200 p-3">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBase key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <Card className="rounded-3xl border-zinc-200 p-4">
            <SkeletonBase className="mb-4 h-6 w-full" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <SkeletonBase key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </Card>
          <Card className="min-h-[200px] rounded-3xl border-zinc-200 p-4">
            <SkeletonBase className="mb-4 h-6 w-56" />
            {[1, 2, 3].map((i) => (
              <SkeletonBase key={i} className="mb-2 h-20 w-full rounded-xl" />
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}