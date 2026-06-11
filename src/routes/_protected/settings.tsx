import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { UAParser } from 'ua-parser-js'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Switch } from '../../components/ui/switch'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from '../../components/ui/alert-dialog'
import { PasswordInput } from '../../components/ui/password-input'
import { PasswordStrength } from '../../components/ui/password-strength'
import { Skeleton } from '../../components/ui/skeleton'
import { DashboardSkeleton } from '../../components/ui/dashboard-skeleton'
import { Shield, User, LogOut, AlertTriangle, Link as LinkIcon, Camera, Save, Github, Mail, Laptop, Smartphone } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsPage,
})

type Session = {
  family_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_active: string;
  is_current: boolean;
  auth_provider: string;
}

function formatUserAgent(uaString: string | null): string {
  if (!uaString) return 'Unknown Device'
  const parser = new UAParser(uaString)
  const browser = parser.getBrowser().name
  const os = parser.getOS().name
  
  if (browser && os) return `${browser} on ${os}`
  if (browser) return browser
  if (os) return os
  return uaString
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  picture: z.string().url("Must be a valid URL.").or(z.literal('')),
  receive_updates: z.boolean(),
});

const passwordSchema = z.object({
  current_password: z.string().optional(),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function SettingsPage() {
  const { user, logout, checkSession, isLoading } = useAuth()
  
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      picture: user?.picture || '',
      receive_updates: user?.receive_updates || false,
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
    }
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        picture: user.picture || '',
        receive_updates: user.receive_updates || false,
      });
      fetchSessions()
    }
  }, [user, profileForm])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/auth/sessions')
      setSessions(response.data)
    } catch (error) {
      console.error("Failed to fetch sessions", error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleRevokeSession = async (familyId: string) => {
    try {
      await api.delete(`/auth/sessions/${familyId}`)
      setSessions(prev => prev.filter(s => s.family_id !== familyId))
      toast.success("Session revoked successfully.");
    } catch (error) {
      console.error("Failed to revoke session", error)
      toast.error("Failed to revoke session.");
    }
  }

  // Fallback initial
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase() || 'U'

  const onSaveProfile = async (data: ProfileFormValues) => {
    try {
      await api.patch('/users/me', data)
      await checkSession() // Refresh the context user
      toast.success('Profile updated successfully!')
      setIsEditingProfile(false)
    } catch (err: any) {
      if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
        err.response.data.detail.forEach((errorObj: any) => {
          const field = errorObj.loc[errorObj.loc.length - 1];
          if (field === 'name' || field === 'picture') {
            profileForm.setError(field as 'name' | 'picture', { type: 'server', message: errorObj.msg });
          }
        });
      } else {
        profileForm.setError('name', {
          type: 'manual',
          message: err.response?.data?.detail || 'Failed to update profile.',
        });
      }
    }
  }

  const onUpdatePassword = async (data: PasswordFormValues) => {
    try {
      await api.patch('/auth/password', {
        current_password: user?.login_methods?.includes('local') ? data.current_password : null,
        new_password: data.new_password
      })
      await checkSession() // Refresh the context user so login_methods updates with 'local'
      toast.success('Password changed successfully!')
      passwordForm.reset()
    } catch (err: any) {
      if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
        err.response.data.detail.forEach((errorObj: any) => {
          const field = errorObj.loc[errorObj.loc.length - 1];
          if (field === 'current_password' || field === 'new_password') {
            passwordForm.setError(field as 'current_password' | 'new_password', { type: 'server', message: errorObj.msg });
          }
        });
      } else {
        passwordForm.setError('current_password', {
          type: 'manual',
          message: err.response?.data?.detail || 'Failed to change password.',
        });
      }
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await api.delete('/users/me')
      // The backend blacklists the token and removes cookies. We just need to trigger local cleanup.
      await logout()
    } catch (err) {
      console.error("Failed to delete account", err)
      toast.error("Failed to delete account.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full pb-10">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 text-slate-50 mb-8 mx-auto max-w-5xl shadow-xl">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 mix-blend-multiply" />
        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="relative h-28 w-28 shrink-0 rounded-full border-4 border-slate-50/20 shadow-2xl overflow-hidden bg-linear-to-br from-indigo-400 to-purple-600 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            {user?.picture ? (
              <img src={user?.picture} alt={user.name || 'User'} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-white shadow-sm">{initial}</span>
            )}
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="text-slate-300 text-lg max-w-lg">
              Manage your profile, security preferences, and view your activity.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
        {/* Left Column: Profile & Accounts */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Card */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <div className="h-1 w-full bg-linear-to-r from-indigo-500 to-purple-500" />
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-indigo-500" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your public identity and preferences.</CardDescription>
              </div>
              {!isEditingProfile && (
                <Button variant="outline" size="sm" onClick={() => {
                  profileForm.reset({
                    name: user?.name || '',
                    picture: user?.picture || '',
                    receive_updates: user?.receive_updates || false,
                  });
                  setIsEditingProfile(true);
                }}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="picture"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Picture URL</FormLabel>
                            <div className="relative">
                              <Camera className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input className="pl-9" placeholder="https://..." {...field} />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="receive_updates"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-slate-100 p-3 bg-slate-50 space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Marketing & Updates</FormLabel>
                            <p className="text-sm text-muted-foreground">Receive emails about new features.</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-100">
                      <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</p>
                    <p className="font-medium text-slate-900">{user?.name || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                    <p className="font-medium text-slate-900 truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marketing Emails</p>
                    <p className="font-medium text-slate-900">{user?.receive_updates ? 'Subscribed' : 'Unsubscribed'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <LinkIcon className="h-5 w-5 text-slate-600" />
                Connected Accounts
              </CardTitle>
              <CardDescription>Accounts linked to your profile for seamless sign-in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.login_methods?.map((method) => (
                <div key={method} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                      {method === 'google' ? (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      ) : method === 'github' ? (
                        <Github className="h-5 w-5 text-slate-800" />
                      ) : method === 'local' ? (
                        <Mail className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{method === 'local' ? 'Email' : method} Account</p>
                      <p className="text-xs text-muted-foreground">{method === 'local' ? 'Password Authenticated' : 'OAuth Provider'}</p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Active
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Security & Actions */}
        <div className="space-y-6">
          
          {/* Security Card */}
          <Card className="shadow-sm border-slate-200/60">
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                  {!user?.login_methods?.includes('local') && (
                    <div className="rounded-lg bg-indigo-50/50 p-3 text-sm text-indigo-700 border border-indigo-100 mb-2 mt-4">
                      You logged in via <strong>{user?.login_methods?.filter(m => m !== 'local').join(', ')}</strong> and don't have a password set. Set one below to enable email/password login!
                    </div>
                  )}
                  
                  {user?.login_methods?.includes('local') && (
                    <FormField
                      control={passwordForm.control}
                      name="current_password"
                      render={({ field }) => (
                        <FormItem className={!user?.login_methods?.includes('local') ? 'hidden' : 'mt-4'}>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <PasswordInput required {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={passwordForm.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem className={!user?.login_methods?.includes('local') ? 'mt-4' : ''}>
                        <FormLabel>{user?.login_methods?.includes('local') ? 'New Password' : 'Set Password'}</FormLabel>
                        <PasswordStrength password={field.value}>
                          <FormControl>
                            <PasswordInput required {...field} />
                          </FormControl>
                        </PasswordStrength>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full mt-4" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? 'Updating...' : (user?.login_methods?.includes('local') ? 'Change Password' : 'Set Password')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Active Sessions Card */}
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Laptop className="h-5 w-5 text-slate-600" />
                Active Sessions
              </CardTitle>
              <CardDescription>Review and manage devices that are currently logged into your account.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.family_id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-white">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                          {session.user_agent?.toLowerCase().includes('mobile') ? (
                            <Smartphone className="h-5 w-5 text-slate-700" />
                          ) : (
                            <Laptop className="h-5 w-5 text-slate-700" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-slate-900" title={session.user_agent || 'Unknown Device'}>
                            {formatUserAgent(session.user_agent)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 wrap-break-words">
                            {session.auth_provider && <span className="capitalize text-slate-700 font-medium">{session.auth_provider}</span>}
                            {session.auth_provider && ' • '}
                            {session.ip_address || 'Unknown IP'} • Active {new Date(session.last_active).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 ml-4">
                        {session.is_current ? (
                          <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            This Device
                          </div>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleRevokeSession(session.family_id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session & Danger Zone Card */}
          <Card className="shadow-sm border-red-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">Session & Danger Zone</h3>
            </div>
            <div className="p-4 space-y-4">
              <Button variant="outline" className="w-full justify-between shadow-sm" onClick={logout}>
                Sign Out
                <LogOut className="h-4 w-4 opacity-70" />
              </Button>
              
              <div className="border-t border-red-100 pt-4 mt-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-between">
                      Delete Account
                      <AlertTriangle className="h-4 w-4 opacity-80" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your account will be deactivated and your active session will be terminated immediately. 
                        Your data is scheduled for permanent deletion in 30 days. You can easily recover your account by simply logging back in during this 30-day window.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

