import { Shield} from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Meshes to match the app */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none" />
      
      {/* Navbar Skeleton */}
      <nav className="w-full px-8 py-6 flex items-center justify-between max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">FastAPI Auth Platform</span>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-24 rounded-md bg-slate-200/60" />
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 w-full max-w-4xl mx-auto relative z-10">
        <Skeleton className="h-8 w-48 rounded-full mb-8 bg-indigo-100/60" />
        <Skeleton className="h-16 w-3/4 max-w-2xl rounded-lg mb-6 bg-slate-200/60" />
        <Skeleton className="h-6 w-2/3 rounded-md mb-4 bg-slate-200/60" />
        <Skeleton className="h-6 w-1/2 rounded-md mb-10 bg-slate-200/60" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-full bg-slate-200/60" />
          <Skeleton className="h-12 w-32 rounded-full bg-slate-200/60" />
        </div>
      </main>
    </div>
  );
}
