import type { ValidationError, ValidationGroups } from './form-validation-types';

export const validationTypes = ['error', 'warning', 'info'] as const;

export function groupValidationErrors(errors: readonly ValidationError[]): ValidationGroups {
  return errors.reduce<ValidationGroups>(
    (groups, error) => {
      const type = error.type ?? 'error';
      groups[type].push(error);
      return groups;
    },
    {
      error: [],
      warning: [],
      info: [],
    }
  );
}

export const validationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
  },

  getPasswordStrength: (password: string): {
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    return { score, feedback };
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidFileSize: (file: File, maxSizeMB: number): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  isRequired: (value: unknown): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined;
  },

  hasMinLength: (value: string, minLength: number): boolean => {
    return value.length >= minLength;
  },

  hasMaxLength: (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
  },

  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  isValidDate: (date: string): boolean => {
    const dateObj = new Date(date);
    return !Number.isNaN(dateObj.getTime());
  },

  isFutureDate: (date: string): boolean => {
    const dateObj = new Date(date);
    const now = new Date();
    return dateObj > now;
  },

  isPastDate: (date: string): boolean => {
    const dateObj = new Date(date);
    const now = new Date();
    return dateObj < now;
  },
};
