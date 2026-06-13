import { Skeleton } from './skeleton'

export function AuthSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column: Form Skeleton */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <Skeleton className="h-9 w-48 mb-4 mx-auto lg:mx-0" />
            <Skeleton className="h-5 w-64 mx-auto lg:mx-0" />
          </div>

          <div className="flex justify-center gap-4 lg:justify-start mb-8">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <Skeleton className="h-10 w-full mt-6" />
          </div>

          <div className="mt-8 flex justify-center lg:justify-start">
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </div>

      {/* Right Column: Premium Background Pattern Skeleton */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        <div className="absolute inset-0 bg-slate-800/50 animate-pulse" />
        <div className="absolute bottom-10 left-10 right-10 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 bg-slate-700" />
            <Skeleton className="h-16 w-full bg-slate-700" />
            <div className="flex items-center gap-2 mt-4">
              <Skeleton className="h-2 w-2 rounded-full bg-emerald-500" />
              <Skeleton className="h-4 w-32 bg-slate-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
