import { createFileRoute, Link } from '@tanstack/react-router'
import { KeyRound, Smartphone, Settings, Github, Mail, ShieldCheck, Zap } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { getRouter } from '../router'
import { toast } from 'sonner'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle
} from '../components/ui/alert-dialog'
import { useAuth } from '../context/AuthContext'
import { Navbar } from '../components/navbar'
import { HomeSkeleton } from '../components/home-skeleton'

export const Route = createFileRoute('/')({ 
  validateSearch: (search: Record<string, unknown>) => {
    return {
      new_user: search.new_user === 'true' || search.new_user === true,
    }
  },
  component: Home 
})

function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const [showOnboarding, setShowOnboarding] = useState(search.new_user || false)

  const handleMarketingDecision = async (optIn: boolean) => {
    if (optIn) {
      try {
        const response = await api.patch('/users/me', { receive_updates: true })
        queryClient.setQueryData(['user'], response.data)
        toast.success("Marketing preferences saved.");
      } catch (e) {
        console.error("Failed to set marketing preference", e);
      }
    }
    setShowOnboarding(false);
    getRouter().navigate({ search: { new_user: undefined } })
  }

  if (isLoading) return <HomeSkeleton />

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col relative overflow-hidden">
      <AlertDialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome to the Network! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              Your account has been successfully created. Would you like to receive occasional emails about new features, updates, and best practices?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleMarketingDecision(false)}>Not right now</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleMarketingDecision(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Yes, keep me updated!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Premium Background Mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none" />
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-sm font-medium mb-8 border border-indigo-200/50 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          Reference Frontend Architecture
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-linear-to-br from-slate-900 via-indigo-900 to-slate-800 tracking-tight text-balance leading-[1.1] mb-6">
          FastAPI Authentication Template
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl text-balance leading-relaxed">
          This project provides a robust, production-ready FastAPI backend template with OAuth, designed to help you initialize new projects quickly. This frontend serves as an interactive reference implementation for securely consuming its APIs.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center min-h-14">
          <a 
            href="https://github.com/Avneesh11905/Fastapi_OAuth_Backend" 
            target="_blank" 
            rel="noreferrer" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-semibold rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 **:text-white"
          >
            <Github className="w-5 h-5" />
            <span>Get the FastAPI Template</span>
          </a>

          {isAuthenticated ? (
            <Link to="/settings" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-full border border-slate-200 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <Settings className="w-5 h-5 text-slate-700" />
              <span>Go to Settings</span>
            </Link>
          ) : (
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-full border border-slate-200 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-slate-700" />
              <span>Create an Account</span>
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mt-24 w-full text-left max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
              <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Stateless JWT & Cookies</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Demonstrates silent token rotation using short-lived access tokens in memory and long-lived HttpOnly refresh cookies to mitigate XSS and CSRF.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 border border-purple-100">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Active Session Control</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              See exactly which devices are logged into your account. The backend tracks active refresh families, allowing you to remotely revoke sessions instantly.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Full Identity Stack</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              A complete suite including OAuth2 (Google/GitHub), Email Verification flows, OTP Password Resets, profile updates, and cascading account deletion.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm">
        <p>Built with React, Vite, Tailwind CSS, and TanStack Router.</p>
      </footer>
    </div>
  )
}
