import { useState, useCallback } from 'react';
import { validateReview, validateLogin, validateSignup } from '@/utils/validation';
import type { ReviewFormData, LoginFormData, SignupFormData } from '@/utils/validation';

interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useFormValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: {},
  });

  const validateReviewForm = useCallback((data: unknown): ValidationState => {
    const result = validateReview(data);
    const state = {
      isValid: result.success,
      errors: result.errors || {},
    };
    setValidationState(state);
    return state;
  }, []);



  const validateLoginForm = useCallback((data: unknown): ValidationState => {
    const result = validateLogin(data);
    const state = {
      isValid: result.success,
      errors: result.errors || {},
    };
    setValidationState(state);
    return state;
  }, []);

  const validateSignupForm = useCallback((data: unknown): ValidationState => {
    const result = validateSignup(data);
    const state = {
      isValid: result.success,
      errors: result.errors || {},
    };
    setValidationState(state);
    return state;
  }, []);

  const clearErrors = useCallback(() => {
    setValidationState({
      isValid: false,
      errors: {},
    });
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
      isValid: false,
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);

  return {
    validationState,
    validateReviewForm,
    validateLoginForm,
    validateSignupForm,
    clearErrors,
    setFieldError,
    clearFieldError,
  };
};
