import React from 'react';

import type { ValidationSchema } from './form-validation-types';

export function useFormValidation<T extends Record<string, unknown>>(
  initialData: T,
  validationSchema: ValidationSchema<T>
) {
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = React.useCallback(<Field extends keyof T>(field: Field, value: T[Field]) => {
    const validator = validationSchema[field];
    const error = validator(value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
    return error;
  }, [validationSchema]);

  const validateForm = React.useCallback((data: T) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach((field) => {
      const typedField = field as keyof T;
      const error = validateField(typedField, data[typedField]);
      if (error) {
        newErrors[typedField] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, validateField]);

  const handleFieldChange = React.useCallback(<Field extends keyof T>(field: Field, value: T[Field]) => {
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  const handleFieldBlur = React.useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
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
    resetValidation,
  };
}
