'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, User, Phone, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import api from '@/lib/axios';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Zod validation schemas
const emailLoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const mobileLoginSchema = z.object({
  mobile: z.string().min(11, 'Mobile number must be at least 11 characters'),
  otp: z.string().length(6, 'OTP must be 6 characters').optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { value: siteName } = useSettings('SITE_NAME');
  const { value: loginBg } = useSettings('LOGIN_BG');
  const [activeTab, setActiveTab] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
  });

  const [mobileForm, setMobileForm] = useState({
    mobile: '',
    otp: '',
  });

  const [errors, setErrors] = useState({});

  // Validate email form fields
  const validateEmailField = (name, value) => {
    try {
      const validationSchema = emailLoginSchema.shape[name];
      validationSchema.parse(value);
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [name]: error.errors[0]?.message || 'Invalid input'
        }));
      }
    }
  };

  // Handle email form changes
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({ ...prev, [name]: value }));
    validateEmailField(name, value);
  };

  // Handle mobile form changes
  const handleMobileChange = (value) => {
    setMobileForm(prev => ({ ...prev, mobile: value }));
    setErrors(prev => ({ ...prev, mobile: undefined }));
  };

  // Send OTP
  const handleSendOTP = async () => {
    try {
      setIsLoading(true);
      const { mobile } = mobileLoginSchema.parse({ mobile: mobileForm.mobile });
      
      const response = await api.post('/mobile-auth/send-otp', { mobile });
      
      if (response.data.success) {
        setIsOtpSent(true);
        setCountdown(60);
        toast.success('OTP sent successfully!');
        
        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role-based redirection
  const handleRedirect = (role) => {
    if (role === 'USER') {
      // A customer sent here mid-booking must land back on checkout, not on
      // their dashboard — otherwise the selection is silently abandoned.
      const pending = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');
      // Same-origin paths only — "//evil.com" is a protocol-relative URL.
      const safe =
        pending && pending.startsWith('/') && !pending.startsWith('//')
          ? pending
          : '/users';
      router.push(safe);
    } else if (role === 'AGENT') {
      // Agents resume a checkout too: they book on behalf of their guests.
      const pending = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');
      const safe =
        pending && pending.startsWith('/') && !pending.startsWith('//')
          ? pending
          : '/agent/partners';
      router.push(safe);
    } else if (role === 'ADMIN' || role === 'VENDOR') {
      // Staff never resume a customer checkout; drop any stale target.
      localStorage.removeItem('redirectAfterLogin');
      router.push('/admin/dashboard');
    }
  };

  // Handle email login
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const validatedData = emailLoginSchema.parse(emailForm);
      
      // Log the data being sent
      console.log('Sending login data:', validatedData);
      
      const response = await api.post('/auth/login', {
        email: validatedData.email,
        password: validatedData.password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Use the login function from useAuth
        await login({ token, user });
        
        toast.success(response.data.message || 'Logged in successfully!');
        handleRedirect(user.role);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', error.response?.data || error);
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mobile login
  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const validatedData = mobileLoginSchema.parse(mobileForm);
      
      // Log the data being sent
      console.log('Sending mobile login data:', validatedData);
      
      const response = await api.post('/mobile-auth/login', {
        mobile: validatedData.mobile,
        otp: validatedData.otp,
      });

      console.log('Mobile login response:', response.data);

      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Use the login function from useAuth
        await login({ token, user });
        
        toast.success(response.data.message || 'Logged in successfully!');
        handleRedirect(user.role);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Mobile login error details:', error.response?.data || error);
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (error) => {
    if (error instanceof z.ZodError) {
      const newErrors = {};
      error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
        toast.error(err.message);
      });
      setErrors(newErrors);
    } else {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      setErrors({});
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />
      
      {/* Left Side - Dynamic Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={loginBg ? `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${loginBg}` : '/default-login-bg.jpg'}
            alt="Login Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-transparent"></div>
        </div>
        <div className="relative z-10 text-white max-w-xl">
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg text-gray-300">Sign in to access your account and manage your bookings with ease.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 bg-zinc-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl font-bold text-sky-500">
              {siteName || 'Myboat MV'}
            </span>
          </Link>

          <Tabs defaultValue="email" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Login with Email
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Login with Mobile
              </TabsTrigger>
            </TabsList>

            {/* Email Login Tab */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={emailForm.email}
                    onChange={handleEmailChange}
                    className={`mt-1 bg-zinc-800/50 border-zinc-700 text-white ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={emailForm.password}
                      onChange={handleEmailChange}
                      className={`bg-zinc-800/50 border-zinc-700 text-white ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-sky-500 hover:text-sky-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-zinc-900 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Mobile Login Tab - Updated with PhoneInput */}
            <TabsContent value="mobile">
              <form onSubmit={handleMobileSubmit} className="space-y-6">
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-300">
                    Mobile Number
                  </label>
                  <div className="mt-1">
                    <PhoneInput
                      international
                      defaultCountry="BD"
                      value={mobileForm.mobile}
                      onChange={handleMobileChange}
                      className={`w-full rounded-md ${errors.mobile ? 'border-red-500' : ''}`}
                      disabled={isOtpSent}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
                  )}
                </div>

                {/* Styled OTP Input */}
                {isOtpSent && (
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
                      Enter OTP
                    </label>
                    <div className="mt-2 flex gap-2 justify-center">
                      {[...Array(6)].map((_, index) => (
                        <Input
                          key={index}
                          type="text"
                          maxLength="1"
                          value={mobileForm.otp[index] || ''}
                          onChange={(e) => {
                            const newOtp = mobileForm.otp.split('');
                            newOtp[index] = e.target.value;
                            setMobileForm(prev => ({
                              ...prev,
                              otp: newOtp.join('')
                            }));
                            // Auto-focus next input
                            if (e.target.value && index < 5) {
                              e.target.nextElementSibling?.focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-lg bg-zinc-800/50 border-zinc-700 text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                              e.target.previousElementSibling?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-sm text-red-500 text-center">{errors.otp}</p>
                    )}
                  </div>
                )}

                <Button
                  type={isOtpSent ? "submit" : "button"}
                  onClick={!isOtpSent ? handleSendOTP : undefined}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-zinc-900 font-semibold h-12"
                  disabled={isLoading || (countdown > 0 && !isOtpSent)}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isOtpSent ? (
                    'Verify OTP'
                  ) : countdown > 0 ? (
                    `Resend OTP in ${countdown}s`
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-gray-400">
            New to {siteName || 'Myboat MV'}?{' '}
            <Link href="/auth/register" className="text-sky-500 hover:text-sky-400 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 