import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Phone, Shield, Loader2, CheckCircle } from 'lucide-react';

interface PhoneVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export function PhoneVerificationModal({ open, onOpenChange, onVerified }: PhoneVerificationModalProps) {
  const { toast } = useToast();
  const { signInWithPhone, verifyPhoneOtp, refreshProfile } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneForSubmit = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Add +1 prefix if it's a 10-digit US number
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // Add + prefix if it starts with 1 (11 digits)
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    // If already has country code, just add +
    if (!phone.startsWith('+')) {
      return `+${digits}`;
    }
    return phone;
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const formattedPhone = formatPhoneForSubmit(phoneNumber);
    
    const { error } = await signInWithPhone(formattedPhone);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Failed to send code',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Code sent!',
      description: 'Check your phone for the verification code.',
    });
    setStep('otp');
  };

  const handleVerifyCode = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const formattedPhone = formatPhoneForSubmit(phoneNumber);
    
    const { error } = await verifyPhoneOtp(formattedPhone, otpCode);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Refresh profile to get updated phone_verified status
    await refreshProfile();
    
    setStep('success');
    toast({
      title: 'Phone verified!',
      description: 'You can now continue submitting reviews.',
    });

    // Auto-close after success
    setTimeout(() => {
      onVerified();
      onOpenChange(false);
      // Reset state for next time
      setStep('phone');
      setPhoneNumber('');
      setOtpCode('');
    }, 1500);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && step !== 'success') {
      // Reset state when closing without success
      setStep('phone');
      setPhoneNumber('');
      setOtpCode('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'phone' && (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl">Help us keep reviews real</DialogTitle>
              <DialogDescription className="text-center mt-2">
                To prevent spam and fake reviews, we ask users who submit multiple reviews to verify their phone number.
                This is a one-time step and helps keep MUVO free and trustworthy for everyone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  We'll send you a one-time verification code via SMS.
                </p>
              </div>

              <Button 
                onClick={handleSendCode} 
                disabled={isLoading} 
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Enter Verification Code</DialogTitle>
              <DialogDescription className="text-center">
                We sent a 6-digit code to {phoneNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={handleVerifyCode} 
                disabled={isLoading || otpCode.length !== 6} 
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Phone Number'
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setStep('phone')}
                className="w-full"
              >
                Use a different number
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">Phone Verified!</DialogTitle>
            <p className="text-muted-foreground">
              You can now continue submitting reviews.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
