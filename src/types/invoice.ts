// Invoice form schema types
export type FieldType = 'string' | 'number' | 'date' | 'email';

export interface FormField {
  name: string;
  type: FieldType;
  required?: boolean;
  label?: string;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ArrayField extends FormField {
  type: 'array';
  items: FormField[];
}

export interface InvoiceFormSchema {
  [key: string]: FieldType | ArrayField;
}

// Form data types
export interface InvoiceFormData {
  [key: string]: string | number | Date | InvoiceFormData[] | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceFormValues {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_email: string;
  items: InvoiceItem[];
  grand_total: number;
  [key: string]: string | number | InvoiceItem[];
}

// Validation schema types
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}
