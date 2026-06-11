import { Skeleton } from './skeleton'
import { Card, CardHeader, CardContent } from './card'

export function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full pb-10">
      {/* Premium Hero Header Skeleton */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/60 text-slate-50 mb-8 mx-auto max-w-5xl shadow-sm">
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <Skeleton className="h-28 w-28 shrink-0 rounded-full border-4 border-slate-50/10 bg-slate-700" />
          
          <div className="text-center md:text-left space-y-3 w-full flex flex-col items-center md:items-start">
            <Skeleton className="h-10 w-64 bg-slate-700" />
            <Skeleton className="h-6 w-80 bg-slate-700/50 max-w-full" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
        {/* Left Column Skeletons */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column Skeletons */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200/60">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-14 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-red-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="border-t border-red-100 pt-4 mt-2 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

