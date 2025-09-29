import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email, username, or phone number is required')
    .refine((value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneDigits = trimmed.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      const usernameRegex = /^[A-Za-z0-9._-]{3,}$/;
      return (
        emailRegex.test(trimmed) ||
        phoneRegex.test(phoneDigits) ||
        usernameRegex.test(trimmed)
      );
    }, 'Please enter a valid email address, username, or phone number'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string()
    .min(1, 'Email or phone number is required')
    .refine((value) => {
      // Check if it's a valid email or phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return emailRegex.test(value) || phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    }, 'Please enter a valid email address or phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export interface PasswordStrength {
  score: number;
  feedback: string[];
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('at least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 25;
  } else {
    feedback.push('number');
  }

  return { score, feedback };
}

