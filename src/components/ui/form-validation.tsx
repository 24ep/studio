"use client";

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import type { ValidationError, ValidationType } from './form-validation-types';
import { groupValidationErrors, validationTypes, validationUtils } from './form-validation-utils';
import { useFormValidation } from './use-form-validation';

export type { ValidationError, ValidationType } from './form-validation-types';
export { useFormValidation, validationUtils };

interface FormValidationProps {
  errors: ValidationError[];
  className?: string;
  showSuccess?: boolean;
  successMessage?: string;
}

interface FieldValidationProps {
  error?: string;
  warning?: string;
  info?: string;
  className?: string;
}

type ValidationAlertConfig = Record<
  ValidationType,
  {
    icon: React.ElementType<{ className?: string }>;
    variant?: 'destructive';
    alertClassName?: string;
    iconClassName?: string;
    descriptionClassName?: string;
  }
>;

const validationAlertConfig: ValidationAlertConfig = {
  error: {
    icon: AlertTriangle,
    variant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    alertClassName: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    iconClassName: 'text-yellow-600',
    descriptionClassName: 'text-yellow-800',
  },
  info: {
    icon: Info,
    alertClassName: 'border-blue-200 bg-blue-50 text-blue-800',
    iconClassName: 'text-blue-600',
    descriptionClassName: 'text-blue-800',
  },
};

export function FormValidation({
  errors,
  className,
  showSuccess = false,
  successMessage = 'Form submitted successfully!',
}: FormValidationProps) {
  if (errors.length === 0 && !showSuccess) {
    return null;
  }

  const groupedErrors = groupValidationErrors(errors);

  return (
    <div className={cn('space-y-3', className)}>
      {showSuccess && <SuccessValidationMessage message={successMessage} />}
      {validationTypes.map((type) => (
        <ValidationMessages key={type} type={type} errors={groupedErrors[type]} />
      ))}
    </div>
  );
}

export function FieldValidation({
  error,
  warning,
  info,
  className,
}: FieldValidationProps) {
  if (!error && !warning && !info) {
    return null;
  }

  return (
    <div className={cn('mt-1 text-sm', className)}>
      {error && <InlineValidationMessage icon={AlertTriangle} className="text-destructive" message={error} />}
      {warning && <InlineValidationMessage icon={AlertTriangle} className="text-yellow-600" message={warning} />}
      {info && <InlineValidationMessage icon={Info} className="text-blue-600" message={info} />}
    </div>
  );
}

function ValidationMessages({
  type,
  errors,
}: {
  type: ValidationType;
  errors: ValidationError[];
}) {
  if (errors.length === 0) {
    return null;
  }

  const config = validationAlertConfig[type];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className={config.alertClassName}>
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <AlertDescription className={config.descriptionClassName}>
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={`${error.field}-${index}`} className="text-sm">
              <strong>{error.field}:</strong> {error.message}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

function SuccessValidationMessage({ message }: { message: string }) {
  return (
    <Alert className="border-green-200 bg-green-50 text-green-800">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        {message}
      </AlertDescription>
    </Alert>
  );
}

function InlineValidationMessage({
  className,
  icon: Icon,
  message,
}: {
  className: string;
  icon: React.ElementType<{ className?: string }>;
  message: string;
}) {
  return (
    <p className={cn('flex items-center gap-1', className)}>
      <Icon className="h-3 w-3" />
      {message}
    </p>
  );
}
