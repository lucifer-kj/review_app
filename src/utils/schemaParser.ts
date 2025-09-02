import { InvoiceFormSchema, FormField, ArrayField } from '@/types/invoice';

// Parse template content and extract placeholders
export function parseTemplatePlaceholders(templateContent: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(templateContent)) !== null) {
    placeholders.push(match[1].trim());
  }

  return [...new Set(placeholders)]; // Remove duplicates
}

// Infer field type from placeholder name and context
export function inferFieldType(placeholder: string): 'string' | 'number' | 'date' | 'email' {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  // Date fields
  if (lowerPlaceholder.includes('date') || lowerPlaceholder.includes('_date')) {
    return 'date';
  }
  
  // Email fields
  if (lowerPlaceholder.includes('email') || lowerPlaceholder.includes('_email')) {
    return 'email';
  }
  
  // Number fields
  if (
    lowerPlaceholder.includes('number') ||
    lowerPlaceholder.includes('quantity') ||
    lowerPlaceholder.includes('price') ||
    lowerPlaceholder.includes('total') ||
    lowerPlaceholder.includes('amount') ||
    lowerPlaceholder.includes('count')
  ) {
    return 'number';
  }
  
  // Default to string
  return 'string';
}

// Generate human-readable label from placeholder
export function generateFieldLabel(placeholder: string): string {
  return placeholder
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Detect array fields (items, products, services, etc.)
export function isArrayField(placeholder: string): boolean {
  const arrayKeywords = ['items', 'products', 'services', 'line_items', 'entries'];
  return arrayKeywords.some(keyword => 
    placeholder.toLowerCase().includes(keyword)
  );
}

// Generate form schema from template placeholders
export function generateFormSchema(placeholders: string[]): InvoiceFormSchema {
  const schema: InvoiceFormSchema = {};
  
  placeholders.forEach(placeholder => {
    if (isArrayField(placeholder)) {
      // Handle array fields (like items)
      const arrayField: ArrayField = {
        name: placeholder,
        type: 'array',
        items: [
          { name: 'description', type: 'string', label: 'Description' },
          { name: 'quantity', type: 'number', label: 'Quantity' },
          { name: 'unit_price', type: 'number', label: 'Unit Price' },
          { name: 'total', type: 'number', label: 'Total' }
        ]
      };
      schema[placeholder] = arrayField;
    } else {
      // Handle regular fields
      const field: FormField = {
        name: placeholder,
        type: inferFieldType(placeholder),
        label: generateFieldLabel(placeholder),
        required: true // Default to required
      };
      schema[placeholder] = field.type;
    }
  });
  
  return schema;
}

// Parse template file and generate schema
export function parseTemplateToSchema(templateContent: string): InvoiceFormSchema {
  const placeholders = parseTemplatePlaceholders(templateContent);
  return generateFormSchema(placeholders);
}

// Example schema for testing
export const exampleSchema: InvoiceFormSchema = {
  invoice_number: 'string',
  invoice_date: 'date',
  due_date: 'date',
  client_name: 'string',
  client_email: 'email',
  items: {
    name: 'items',
    type: 'array',
    items: [
      { name: 'description', type: 'string', label: 'Description' },
      { name: 'quantity', type: 'number', label: 'Quantity' },
      { name: 'unit_price', type: 'number', label: 'Unit Price' },
      { name: 'total', type: 'number', label: 'Total' }
    ]
  },
  grand_total: 'number'
};
