import { createFileRoute, Link, useNavigate, Navigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { PasswordStrength } from '../components/ui/password-strength'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { AuthSkeleton } from '../components/ui/auth-skeleton'
import { toast } from 'sonner'

// Define the expected search parameters for type safety
type ResetPasswordSearch = {
  token?: string
}

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    return {
      token: search.token as string | undefined,
    }
  },
  component: ResetPasswordPage,
})

const requestSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const resetSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
});

type RequestFormValues = z.infer<typeof requestSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  
  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '' },
  });

  if (isLoading) {
    return <AuthSkeleton />
  }

  // Logged in users shouldn't  // If the background session check determines they are logged in, bounce them!
  if (isAuthenticated) {
    return <Navigate to="/settings" />
  }

  // Step 1: Request a magic link
  const onRequestSubmit = async (data: RequestFormValues) => {
    try {
      await api.post('/auth/password/forgot', data);
      toast.success('If an account exists, a secure reset link has been sent to your email.');
    } catch (err: any) {
      requestForm.setError('email', {
        type: 'manual',
        message: err.response?.data?.detail || 'Failed to request password reset.',
      });
    }
  }

  // Step 2: Use the magic link token to set a new password
  const onResetSubmit = async (data: ResetFormValues) => {
    try {
      await api.post('/auth/password/reset', { token, new_password: data.password });
      toast.success('Password updated successfully! You can now log in.');
      setTimeout(() => navigate({ to: '/login' }), 2000);
    } catch (err: any) {
      resetForm.setError('password', {
        type: 'manual',
        message: err.response?.data?.detail || 'Invalid or expired token.',
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column: Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          
          <Button 
            variant="ghost" 
            className="mb-8 -ml-4 text-muted-foreground hover:text-foreground" 
            asChild
          >
            <Link to="/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </Button>

          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {token ? 'Create new password' : 'Forgot password?'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {token 
                ? 'Enter your new password below to regain access to your account.' 
                : 'No worries, we\'ll send you reset instructions.'}
            </p>
          </div>

          {token ? (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <PasswordStrength password={field.value}>
                        <FormControl>
                          <PasswordInput {...field} />
                        </FormControl>
                      </PasswordStrength>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full h-11 text-base mt-4" disabled={resetForm.formState.isSubmitting || resetForm.formState.isSubmitSuccessful}>
                  {resetForm.formState.isSubmitting ? 'Updating...' : 'Reset password'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-5">
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full h-11 text-base mt-4" disabled={requestForm.formState.isSubmitting}>
                  {requestForm.formState.isSubmitting ? 'Sending...' : 'Send reset instructions'}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>

      {/* Right Column: Premium Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1555617781-067f92e6a3d6?q=80&w=2564&auto=format&fit=crop" 
          alt="Security aesthetic" 
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply" />
        
        <div className="absolute bottom-10 left-10 right-10 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">Secure Recovery</h3>
            <p className="text-slate-200">
              Safely regain access to your account through encrypted single-use tokens and resilient validation architectures.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-blue-400">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              Identity Protected
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

