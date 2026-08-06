'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Zod validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  mobile: z.string()
    .min(1, 'Mobile number is required')
    .refine((value) => {
      return value && value.length > 0;
    }, 'Mobile number is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Please select a gender',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  // Only self-service roles are offered. The API rejects anything else, so a
  // tampered payload cannot escalate here.
  role: z.enum(['USER', 'AGENT']).default('USER'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { value: siteName } = useSettings('SITE_NAME');
  const { value: registerBg } = useSettings('REGISTER_BG');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    gender: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    try {
      let validationSchema;
      
      if (name === 'confirmPassword') {
        if (value !== formData.password) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: "Passwords don't match"
          }));
          return;
        }
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
        return;
      }

      if (name === 'gender') {
        validationSchema = registerSchema.shape.gender;
      } else {
        validationSchema = registerSchema.shape[name];
      }

      if (!validationSchema) return;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleGenderChange = (value) => {
    setFormData(prev => ({ ...prev, gender: value }));
    validateField('gender', value);
  };

  const handleMobileChange = (value) => {
    setFormData(prev => ({ ...prev, mobile: value || '' }));
    
    if (!value) {
      setErrors(prev => ({ ...prev, mobile: 'Mobile number is required' }));
      return;
    }

    setErrors(prev => ({ ...prev, mobile: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate all fields
      const validatedData = registerSchema.parse(formData);
      
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = validatedData;
      
      // Attempt registration
      const role = await register(registrationData);
      toast.success(
        registrationData.role === 'AGENT'
          ? 'Agent account created. Apply to the operators you work with.'
          : 'Account created successfully!'
      );
      // Send people where their account actually lives — everyone was being
      // pushed to the operator dashboard regardless of role.
      if (role === 'ADMIN' || role === 'VENDOR') router.push('/admin/dashboard');
      else if (role === 'AGENT') router.push('/agent/partners');
      else router.push('/users');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        // Show all validation errors in toast
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        console.error('Registration failed:', error);
        toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />
      {/* Left Side - Dynamic Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={registerBg ? `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${registerBg}` : '/default-register-bg.jpg'}
            alt="Registration Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-transparent"></div>
        </div>
        <div className="relative z-10 text-white max-w-xl">
          <h1 className="text-4xl font-bold mb-4">Welcome to {siteName || 'Myboat MV'}</h1>
          <p className="text-lg text-gray-300">Join us for a seamless ferry booking experience</p>
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
          <h2 className="text-2xl font-semibold text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Join us for a seamless ferry booking experience
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account type — decides which workspace they land in */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-ocean-deep">
                I am signing up as
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: 'USER',
                    title: 'Traveller',
                    desc: 'Book ferry seats, charters and cargo',
                  },
                  {
                    value: 'AGENT',
                    title: 'Agent / Guesthouse',
                    desc: 'Sell operator seats and earn commission',
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                      formData.role === opt.value
                        ? 'border-sky-500 bg-sky-50/60'
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={formData.role === opt.value}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, role: e.target.value }))
                      }
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium">{opt.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1 bg-zinc-800/50 border-zinc-700 text-white ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1 bg-zinc-800/50 border-zinc-700 text-white ${
                    errors.lastName ? 'border-red-500' : ''
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 bg-zinc-800/50 border-zinc-700 text-white ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-300">
                Mobile Number
              </label>
              <div className="mt-1">
                <PhoneInput
                  international
                  defaultCountry="BD"
                  value={formData.mobile}
                  onChange={handleMobileChange}
                  className={`w-full rounded-md ${errors.mobile ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <RadioGroup
                value={formData.gender}
                onValueChange={handleGenderChange}
                className="flex space-x-4"
                required
              >
                <div className="flex items-center space-x-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 hover:bg-zinc-900/80 transition-colors">
                  <RadioGroupItem value="MALE" id="male" className="text-sky-500" />
                  <Label htmlFor="male" className="text-gray-300 cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 hover:bg-zinc-900/80 transition-colors">
                  <RadioGroupItem value="FEMALE" id="female" className="text-sky-500" />
                  <Label htmlFor="female" className="text-gray-300 cursor-pointer">Female</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 hover:bg-zinc-900/80 transition-colors">
                  <RadioGroupItem value="OTHER" id="other" className="text-sky-500" />
                  <Label htmlFor="other" className="text-gray-300 cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
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
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`bg-zinc-800/50 border-zinc-700 text-white ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-zinc-900 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-sky-500 hover:text-sky-400 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 