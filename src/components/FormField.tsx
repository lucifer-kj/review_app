import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField as FormFieldPrimitive, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { FieldType } from '@/types/invoice';

interface FormFieldProps {
  name: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  type,
  label,
  placeholder,
  required = false,
  validation,
  className = ''
}) => {
  const form = useFormContext();

  const getInputType = () => {
    switch (type) {
      case 'email':
        return 'email';
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  const getValidationRules = () => {
    const rules: Record<string, unknown> = {};

    if (required) {
      rules.required = validation?.message || `${label || name} is required`;
    }

    if (type === 'email') {
      rules.pattern = {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      };
    }

    if (type === 'number') {
      if (validation?.min !== undefined) {
        rules.min = {
          value: validation.min,
          message: `Must be at least ${validation.min}`
        };
      }
      if (validation?.max !== undefined) {
        rules.max = {
          value: validation.max,
          message: `Must be no more than ${validation.max}`
        };
      }
    }

    if (validation?.pattern) {
      rules.pattern = {
        value: new RegExp(validation.pattern),
        message: validation.message || 'Invalid format'
      };
    }

    return rules;
  };

  const renderInput = () => {
    const inputType = getInputType();
    const inputProps = {
      placeholder: placeholder || `Enter ${label || name}`,
      className: 'w-full'
    };

    if (type === 'string' && (name.includes('description') || name.includes('notes') || name.includes('address'))) {
      return (
        <Textarea
          {...inputProps}
          rows={3}
          className="w-full resize-none"
        />
      );
    }

    return (
      <Input
        type={inputType}
        {...inputProps}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' && validation?.min ? validation.min : undefined}
        max={type === 'number' && validation?.max ? validation.max : undefined}
      />
    );
  };

  return (
    <FormFieldPrimitive
      control={form.control}
      name={name}
      rules={getValidationRules()}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-sm font-medium">
            {label || name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {renderInput()}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
