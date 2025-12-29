import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, CheckCircle, User, MapPin, Compass, AtSign, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, TravelerType } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { UserProfileCard } from '@/components/UserProfileCard';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { MembershipSelector } from '@/components/MembershipSelector';
import { supabase } from '@/integrations/supabase/client';

// Schemas
const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[A-Za-z'-]+$/, 'Only letters, hyphens, and apostrophes allowed'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[A-Za-z'-]+$/, 'Only letters, hyphens, and apostrophes allowed'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-z0-9]+$/, 'Only lowercase letters and numbers allowed'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
});

const signInEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const profileCompletionSchema = z.object({
  travelerType: z.string().optional(),
  homeBase: z.string().max(100, 'Home base is too long').optional(),
});

type SignUpForm = z.infer<typeof signUpSchema>;
type SignInEmailForm = z.infer<typeof signInEmailSchema>;
type ProfileCompletionForm = z.infer<typeof profileCompletionSchema>;

type AuthMode = 'signup' | 'signin' | 'check-email' | 'confirmed' | 'complete-profile' | 'accept-terms';

const TRAVELER_TYPES: { value: TravelerType; label: string; icon: string }[] = [
  { value: 'rv_full_timer', label: 'RV Full-Timer', icon: '🚐' },
  { value: 'weekend_rver', label: 'Weekend RVer', icon: '🏕️' },
  { value: 'van_life', label: 'Van Life', icon: '🚌' },
  { value: 'tent_camper', label: 'Tent Camper', icon: '⛺' },
  { value: 'just_exploring', label: 'Just Exploring', icon: '🧭' },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { 
    user, 
    profile, 
    loading, 
    needsProfileCompletion,
    needsTermsAcceptance,
    signInWithEmail,
    signUp,
    signOut,
    checkUsernameAvailable,
    completeProfile,
    acceptTerms,
    refreshProfile,
  } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [selectedTravelerType, setSelectedTravelerType] = useState<TravelerType | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsAcceptedForSubmit, setTermsAcceptedForSubmit] = useState(false);

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      firstName: '', 
      lastName: '', 
      username: '', 
      email: '', 
      password: '',
      termsAccepted: false,
    },
  });

  const signInForm = useForm<SignInEmailForm>({
    resolver: zodResolver(signInEmailSchema),
    defaultValues: { email: '', password: '' },
  });

  const profileForm = useForm<ProfileCompletionForm>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: { travelerType: '', homeBase: '' },
  });

  // Watch username for availability check
  const watchedUsername = signUpForm.watch('username');

  useEffect(() => {
    if (watchedUsername && watchedUsername.length >= 3) {
      const timer = setTimeout(async () => {
        setCheckingUsername(true);
        const available = await checkUsernameAvailable(watchedUsername);
        setUsernameAvailable(available);
        setCheckingUsername(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [watchedUsername, checkUsernameAvailable]);

  // Check URL params for mode and handle email confirmation
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signin') {
      setMode('signin');
    }
    
    // Handle email confirmation callback
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'signup' && accessToken) {
        const { data: { user: confirmedUser } } = await supabase.auth.getUser();
        if (confirmedUser) {
          await supabase
            .from('profiles')
            .update({ 
              email_verified: true, 
              email_verified_at: new Date().toISOString(),
              is_verified: true
            })
            .eq('id', confirmedUser.id);
          
          setMode('confirmed');
          toast({
            title: 'Email verified!',
            description: 'Your account is now fully verified.',
          });
          
          window.history.replaceState(null, '', window.location.pathname);
          
          // Check if profile needs completion
          setTimeout(async () => {
            await refreshProfile();
          }, 500);
        }
      }
    };
    
    handleEmailConfirmation();
  }, [searchParams, toast, refreshProfile]);

  // Switch to appropriate mode based on user state
  useEffect(() => {
    if (!loading && user && profile) {
      if (needsTermsAcceptance) {
        setMode('accept-terms');
      } else if (needsProfileCompletion) {
        setMode('complete-profile');
      }
    }
  }, [loading, user, profile, needsProfileCompletion, needsTermsAcceptance]);

  // Sign up with all required fields
  async function handleSignUp(data: SignUpForm) {
    if (!usernameAvailable) {
      toast({
        title: 'Username unavailable',
        description: 'Please choose a different username.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setSignupEmail(data.email);
    setMode('check-email');
  }

  // Sign in with email
  async function handleSignIn(data: SignInEmailForm) {
    setIsSubmitting(true);
    const { error } = await signInWithEmail(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Welcome back!',
    });
    navigate('/');
  }

  // Accept terms (for existing users who haven't accepted)
  async function handleAcceptTerms() {
    if (!termsAcceptedForSubmit) {
      toast({
        title: 'Terms required',
        description: 'You must agree to the Terms of Service and Privacy Policy.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await acceptTerms();
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Terms accepted',
      description: 'You can now use all features.',
    });
    navigate('/');
  }

  // Complete optional profile info
  async function handleProfileCompletion(data: ProfileCompletionForm) {
    setIsSubmitting(true);
    const { error } = await completeProfile({
      traveler_type: selectedTravelerType,
      home_base: data.homeBase || null,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Failed to save profile',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Welcome to MUVO!',
      description: 'Your profile is all set.',
    });
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  // Email confirmed successfully
  if (mode === 'confirmed') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h1 className="font-display text-xl font-semibold mb-2">Email Verified!</h1>
            <p className="text-muted-foreground mb-4">
              Your account is ready. Let's customize your experience...
            </p>
            <Button onClick={() => setMode('complete-profile')}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Terms acceptance screen (for existing users who need to accept)
  if (mode === 'accept-terms' && user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-6 max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="font-display text-xl font-semibold mb-2">Terms & Privacy</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Please review and accept our Terms of Service and Privacy Policy to continue using MUVO.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-accept"
                  checked={termsAcceptedForSubmit}
                  onCheckedChange={(checked) => setTermsAcceptedForSubmit(checked === true)}
                />
                <label htmlFor="terms-accept" className="text-sm leading-tight">
                  I agree to MUVO's{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              <Button
                onClick={handleAcceptTerms}
                className="w-full"
                disabled={isSubmitting || !termsAcceptedForSubmit}
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>

        <TermsPrivacyModal
          open={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          type="terms"
        />
        <TermsPrivacyModal
          open={privacyModalOpen}
          onClose={() => setPrivacyModalOpen(false)}
          type="privacy"
        />
      </div>
    );
  }

  // Profile completion step (optional info after signup)
  if (mode === 'complete-profile' && user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-6 max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="font-display text-xl font-semibold mb-2">Almost there!</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Tell us a bit more about yourself (optional).
            </p>

            <form onSubmit={profileForm.handleSubmit(handleProfileCompletion)} className="space-y-5">
              {/* Traveler Type */}
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <Compass className="w-3.5 h-3.5" />
                  Traveler Type <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAVELER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedTravelerType(
                        selectedTravelerType === type.value ? null : type.value
                      )}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                        selectedTravelerType === type.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Base */}
              <div>
                <Label htmlFor="homeBase" className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Home Base <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="homeBase"
                  placeholder="Austin, TX"
                  className="mt-1.5"
                  {...profileForm.register('homeBase')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where you're from. Just city and state/country.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Skip
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Resend verification email
  const [resendingEmail, setResendingEmail] = useState(false);
  
  async function handleResendVerification() {
    if (!signupEmail) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Email sent!',
        description: 'Check your inbox for a new verification link.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(false);
    }
  }

  // Check email screen after signup
  if (mode === 'check-email') {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-8 max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-xl font-semibold mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-4">
              We sent a verification link to:
            </p>
            <p className="font-medium text-foreground mb-6">{signupEmail}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Click the link in the email to verify your account and start contributing.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleResendVerification}
                disabled={resendingEmail}
              >
                {resendingEmail ? 'Sending...' : "Didn't receive it? Resend email"}
              </Button>
              <Button variant="outline" onClick={() => setMode('signin')}>
                Back to Sign In
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // User is logged in and profile is complete - show profile
  if (user && profile && profile.profile_completed && profile.terms_accepted_at) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header showBack />
        <main className="container px-4 py-6 max-w-md mx-auto space-y-4">
          <UserProfileCard profile={profile} />
          
          {/* Show verification status */}
          {!profile.is_verified && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                ⚠️ Please verify your email to contribute. Check your inbox for the verification link.
              </p>
            </div>
          )}

          {/* Memberships Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                My Memberships
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Select memberships you have to see included parks
              </p>
            </CardHeader>
            <CardContent>
              <MembershipSelector compact />
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(`/profile/${profile.username}`)}
            >
              View Public Profile
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={async () => {
                await signOut();
                navigate('/auth');
              }}
            >
              Sign out
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Sign in form
  if (mode === 'signin') {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="container px-4 py-8 max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="font-display text-xl font-semibold mb-6">Welcome back</h1>

            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...signInForm.register('email')}
                  />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...signInForm.register('password')}
                  />
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button variant="link" onClick={() => setMode('signup')}>
                Don't have an account? Sign up
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Default: Sign up form with all required fields
  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      <main className="container px-4 py-6 max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="font-display text-xl font-semibold mb-2">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Join the MUVO community and start contributing.
          </p>

          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Mike"
                  className="mt-1"
                  {...signUpForm.register('firstName')}
                />
                {signUpForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Johnson"
                  className="mt-1"
                  {...signUpForm.register('lastName')}
                />
                {signUpForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5" />
                Username <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="username"
                  placeholder="roadlifemike"
                  className="lowercase"
                  {...signUpForm.register('username', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                    },
                  })}
                />
                {checkingUsername && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Checking...
                  </span>
                )}
                {!checkingUsername && usernameAvailable === true && watchedUsername.length >= 3 && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">
                    Taken
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters and numbers only. This is your public handle.
              </p>
              {signUpForm.formState.errors.username && (
                <p className="text-sm text-destructive mt-1">
                  {signUpForm.formState.errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="signup-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...signUpForm.register('email')}
                />
              </div>
              {signUpForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {signUpForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="signup-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...signUpForm.register('password')}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                At least 8 characters.
              </p>
              {signUpForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {signUpForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Terms & Privacy Checkbox */}
            <div className="pt-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={signUpForm.watch('termsAccepted')}
                  onCheckedChange={(checked) => 
                    signUpForm.setValue('termsAccepted', checked === true, { shouldValidate: true })
                  }
                />
                <label htmlFor="terms" className="text-sm leading-tight">
                  I agree to MUVO's{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Privacy Policy
                  </button>
                  <span className="text-destructive"> *</span>
                </label>
              </div>
              {signUpForm.formState.errors.termsAccepted && (
                <p className="text-sm text-destructive mt-2">
                  {signUpForm.formState.errors.termsAccepted.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || usernameAvailable === false}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setMode('signin')}>
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      </main>

      <TermsPrivacyModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        type="terms"
      />
      <TermsPrivacyModal
        open={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        type="privacy"
      />
    </div>
  );
}
