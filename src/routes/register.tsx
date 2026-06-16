import { createFileRoute, Link, useNavigate, Navigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, API_URL } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { PasswordStrength } from '../components/ui/password-strength'
import { Github } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { toast } from 'sonner'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
)

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
});

const verifySchema = z.object({
  otp: z.string().length(6, "Verification code must be exactly 6 digits.").regex(/^\d+$/, "Verification code must contain only numbers."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type VerifyFormValues = z.infer<typeof verifySchema>;

import { AuthSkeleton } from '../components/ui/auth-skeleton'

function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      otp: '',
    },
  });

  if (isLoading) {
    return <AuthSkeleton />
  }

  if (isAuthenticated) {
    return <Navigate to="/settings" />
  }

  const onRegister = async (data: RegisterFormValues) => {
    try {
      await api.post('/auth/register', data, { skipAuthRefresh: true });
      setRegisteredEmail(data.email);
      setStep(2); // Move to OTP verification step
    } catch (err: any) {
      if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
        err.response.data.detail.forEach((errorObj: any) => {
          const field = errorObj.loc[errorObj.loc.length - 1];
          if (field === 'email' || field === 'password') {
            registerForm.setError(field as 'email' | 'password', { type: 'server', message: errorObj.msg });
          }
        });
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to register. Please try again.';
        registerForm.setError('email', { type: 'manual', message: errorMessage });
      }
    }
  }

  const onVerify = async (data: VerifyFormValues) => {
    try {
      const res = await api.post('/auth/verify-email', { email: registeredEmail, otp: data.otp });
      toast.success(res.data?.message || 'Email verified successfully!');
      
      await login();
      
      navigate({ to: '/', search: { new_user: true } as any });
    } catch (err: any) {
      verifyForm.setError('otp', {
        type: 'manual',
        message: err.response?.data?.detail || 'Invalid verification code.',
      });
    }
  }

  const resendCode = async () => {
    try {
      await api.post('/auth/verify-email/resend', { email: registeredEmail });
      toast.success('A new verification code has been sent to your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to resend code.');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column: Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {step === 1 ? 'Create an account' : 'Verify your email'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {step === 1 
                ? 'Join us to get started with your premium experience' 
                : `We sent a 6-digit code to ${registeredEmail}`}
            </p>
          </div>

          {step === 1 ? (
            <>
              <div className="flex justify-center gap-4 lg:justify-start">
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12" asChild>
                  <a href={`${API_URL}/auth/login/google`} aria-label="Sign up with Google">
                    <GoogleIcon className="h-6 w-6" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12" asChild>
                  <a href={`${API_URL}/auth/login/github`} aria-label="Sign up with GitHub">
                    <Github className="h-6 w-6" />
                  </a>
                </Button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase lg:justify-start">
                  <span className="bg-background px-2 text-muted-foreground lg:pr-2 lg:pl-0">
                    Or register with email
                  </span>
                </div>
              </div>

              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
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
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <PasswordStrength password={field.value}>
                          <FormControl>
                            <PasswordInput {...field} />
                          </FormControl>
                        </PasswordStrength>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full mt-6" disabled={registerForm.formState.isSubmitting}>
                    {registerForm.formState.isSubmitting ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
              </Form>

              <p className="mt-8 text-center text-sm text-muted-foreground lg:text-left">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="text" 
                          inputMode="numeric"
                          placeholder="123456" 
                          maxLength={6}
                          className="text-center text-2xl tracking-[0.5em] h-14"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col gap-2 mt-6">
                  <Button type="submit" className="w-full" disabled={verifyForm.formState.isSubmitting}>
                    {verifyForm.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={resendCode}
                  >
                    Resend Code
                  </Button>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setStep(1)}
                  >
                    Use a different email
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>

      {/* Right Column: Premium Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          alt="Premium background pattern" 
          className="absolute inset-0 h-full w-full object-cover opacity-90 scale-x-[-1]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 to-slate-900/20 mix-blend-multiply" />
        <div className="absolute bottom-10 left-10 right-10 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">Join the Network</h3>
            <p className="text-slate-200">
              Experience seamless onboarding with advanced session management, strict CSRF mitigation, and real-time active device tracking.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-indigo-400">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Enterprise Grade
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

