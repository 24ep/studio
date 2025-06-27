"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
export function FormValidation({ errors, className, showSuccess = false, successMessage = 'Form submitted successfully!' }) {
    if (errors.length === 0 && !showSuccess) {
        return null;
    }
    const errorErrors = errors.filter(e => e.type !== 'warning' && e.type !== 'info');
    const warnings = errors.filter(e => e.type === 'warning');
    const infos = errors.filter(e => e.type === 'info');
    return (<div className={cn('space-y-3', className)}>
      {/* Success Message */}
      {showSuccess && (<Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600"/>
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>)}

      {/* Error Messages */}
      {errorErrors.length > 0 && (<Alert variant="destructive">
          <AlertTriangle className="h-4 w-4"/>
          <AlertDescription>
            <div className="space-y-1">
              {errorErrors.map((error, index) => (<div key={index} className="text-sm">
                  <strong>{error.field}:</strong> {error.message}
                </div>))}
            </div>
          </AlertDescription>
        </Alert>)}

      {/* Warning Messages */}
      {warnings.length > 0 && (<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600"/>
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              {warnings.map((warning, index) => (<div key={index} className="text-sm">
                  <strong>{warning.field}:</strong> {warning.message}
                </div>))}
            </div>
          </AlertDescription>
        </Alert>)}

      {/* Info Messages */}
      {infos.length > 0 && (<Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <Info className="h-4 w-4 text-blue-600"/>
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              {infos.map((info, index) => (<div key={index} className="text-sm">
                  <strong>{info.field}:</strong> {info.message}
                </div>))}
            </div>
          </AlertDescription>
        </Alert>)}
    </div>);
}
export function FieldValidation({ error, warning, info, className }) {
    if (!error && !warning && !info) {
        return null;
    }
    return (<div className={cn('mt-1 text-sm', className)}>
      {error && (<p className="text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3"/>
          {error}
        </p>)}
      {warning && (<p className="text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3"/>
          {warning}
        </p>)}
      {info && (<p className="text-blue-600 flex items-center gap-1">
          <Info className="h-3 w-3"/>
          {info}
        </p>)}
    </div>);
}
// Validation utilities
export const validationUtils = {
    // Email validation
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    // Phone validation (basic)
    isValidPhone: (phone) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },
    // Password strength validation
    getPasswordStrength: (password) => {
        const feedback = [];
        let score = 0;
        if (password.length >= 8) {
            score += 1;
        }
        else {
            feedback.push('Password must be at least 8 characters long');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one lowercase letter');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one uppercase letter');
        }
        if (/[0-9]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one number');
        }
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain at least one special character');
        }
        return { score, feedback };
    },
    // URL validation
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    },
    // File size validation
    isValidFileSize: (file, maxSizeMB) => {
        return file.size <= maxSizeMB * 1024 * 1024;
    },
    // File type validation
    isValidFileType: (file, allowedTypes) => {
        return allowedTypes.includes(file.type);
    },
    // Required field validation
    isRequired: (value) => {
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value !== null && value !== undefined;
    },
    // Min length validation
    hasMinLength: (value, minLength) => {
        return value.length >= minLength;
    },
    // Max length validation
    hasMaxLength: (value, maxLength) => {
        return value.length <= maxLength;
    },
    // Number range validation
    isInRange: (value, min, max) => {
        return value >= min && value <= max;
    },
    // Date validation
    isValidDate: (date) => {
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
    },
    // Future date validation
    isFutureDate: (date) => {
        const dateObj = new Date(date);
        const now = new Date();
        return dateObj > now;
    },
    // Past date validation
    isPastDate: (date) => {
        const dateObj = new Date(date);
        const now = new Date();
        return dateObj < now;
    }
};
// Custom validation hooks
export function useFormValidation(initialData, validationSchema) {
    const [errors, setErrors] = React.useState({});
    const [touched, setTouched] = React.useState({});
    const validateField = React.useCallback((field, value) => {
        const validator = validationSchema[field];
        if (validator) {
            const error = validator(value);
            setErrors(prev => ({
                ...prev,
                [field]: error
            }));
            return error;
        }
        return undefined;
    }, [validationSchema]);
    const validateForm = React.useCallback((data) => {
        const newErrors = {};
        let isValid = true;
        Object.keys(validationSchema).forEach((field) => {
            const error = validateField(field, data[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    }, [validationSchema, validateField]);
    const handleFieldChange = React.useCallback((field, value) => {
        if (touched[field]) {
            validateField(field, value);
        }
    }, [touched, validateField]);
    const handleFieldBlur = React.useCallback((field) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));
    }, []);
    const resetValidation = React.useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);
    return {
        errors,
        touched,
        validateField,
        validateForm,
        handleFieldChange,
        handleFieldBlur,
        resetValidation
    };
}
