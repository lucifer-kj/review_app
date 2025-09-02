# Dynamic Invoice Form Generator

A comprehensive React + TypeScript solution for automatically generating invoice forms from templates with placeholders.

## 🚀 Features

- **🔄 Dynamic Field Generation**: Automatically creates form fields based on template placeholders
- **📊 Array Support**: Handles dynamic arrays like invoice items with add/remove functionality
- **✅ Validation**: Built-in validation for email, numbers, dates, and required fields
- **🎨 Clean UI**: Modern, responsive design with Tailwind CSS styling
- **🔧 TypeScript**: Fully typed for better development experience
- **📦 Modular**: Reusable components for different field types and arrays

## 📁 File Structure

```
src/
├── components/
│   ├── DynamicInvoiceForm.tsx    # Main form component
│   ├── FormField.tsx             # Individual field component
│   └── DynamicTable.tsx          # Array field component
├── types/
│   └── invoice.ts               # TypeScript type definitions
├── utils/
│   └── schemaParser.ts         # Template parsing utilities
└── pages/
    └── DynamicFormDemo.tsx      # Demo page
```

## 🎯 Usage

### Basic Usage

```tsx
import { DynamicInvoiceForm } from '@/components/DynamicInvoiceForm';
import { InvoiceFormSchema } from '@/types/invoice';

const schema: InvoiceFormSchema = {
  invoice_number: 'string',
  invoice_date: 'date',
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

const handleSubmit = (data: InvoiceFormValues) => {
  console.log('Form data:', data);
  // Send to your backend or n8n webhook
};

<DynamicInvoiceForm
  schema={schema}
  onSubmit={handleSubmit}
  loading={false}
/>
```

### Template Parsing

```tsx
import { parseTemplateToSchema } from '@/utils/schemaParser';

const template = `
  Invoice #{{invoice_number}}
  Date: {{invoice_date}}
  Client: {{client_name}}
  Email: {{client_email}}
  
  Items:
  {{#each items}}
    {{description}} - Qty: {{quantity}} @ ${{unit_price}} = ${{total}}
  {{/each}}
  
  Total: ${{grand_total}}
`;

const schema = parseTemplateToSchema(template);
```

## 🔧 Components

### DynamicInvoiceForm

The main component that orchestrates the entire form generation.

**Props:**
- `schema: InvoiceFormSchema` - The form schema defining fields and types
- `onSubmit: (data: InvoiceFormValues) => void` - Callback when form is submitted
- `loading?: boolean` - Loading state for submit button
- `className?: string` - Additional CSS classes

**Features:**
- Automatically generates Zod validation schema
- Handles form state with react-hook-form
- Processes data before submission (calculates totals, etc.)
- Responsive grid layout for fields

### FormField

Renders individual form fields based on type.

**Supported Types:**
- `string` - Text input or textarea (for descriptions, addresses)
- `number` - Number input with step 0.01
- `date` - Date picker
- `email` - Email input with validation

**Features:**
- Automatic validation rules
- Smart input type detection
- Responsive design
- Error message display

### DynamicTable

Handles array fields like invoice items.

**Features:**
- Add/remove items dynamically
- Auto-calculation of row totals
- Summary section with grand total
- Drag-and-drop ready (can be extended)

## 📊 Type System

### Core Types

```typescript
type FieldType = 'string' | 'number' | 'date' | 'email';

interface FormField {
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

interface ArrayField extends FormField {
  type: 'array';
  items: FormField[];
}

interface InvoiceFormSchema {
  [key: string]: FieldType | ArrayField;
}
```

### Form Data Types

```typescript
interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceFormValues {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_email: string;
  items: InvoiceItem[];
  grand_total: number;
  [key: string]: string | number | InvoiceItem[];
}
```

## 🔍 Template Parsing

The `schemaParser.ts` utility provides intelligent template parsing:

### Placeholder Detection

```typescript
// Extracts placeholders from template
const placeholders = parseTemplatePlaceholders(template);
// Returns: ['invoice_number', 'invoice_date', 'client_name', ...]
```

### Type Inference

```typescript
// Automatically infers field types
const type = inferFieldType('client_email'); // Returns: 'email'
const type = inferFieldType('invoice_date'); // Returns: 'date'
const type = inferFieldType('grand_total');  // Returns: 'number'
```

### Array Detection

```typescript
// Detects array fields
const isArray = isArrayField('items'); // Returns: true
const isArray = isArrayField('products'); // Returns: true
```

## ✅ Validation

### Built-in Validation

- **Required Fields**: All fields are required by default
- **Email Validation**: Proper email format validation
- **Number Validation**: Positive numbers with min/max constraints
- **Date Validation**: Valid date format
- **Array Validation**: At least one item required

### Custom Validation

```typescript
const schema: InvoiceFormSchema = {
  invoice_number: 'string',
  grand_total: {
    name: 'grand_total',
    type: 'number',
    validation: {
      min: 0,
      max: 10000,
      message: 'Total must be between 0 and 10,000'
    }
  }
};
```

## 🎨 Styling

The components use Tailwind CSS with a clean, modern design:

- **Responsive Grid**: Automatically adapts to screen size
- **Card Layout**: Clean card-based design
- **Consistent Spacing**: Proper spacing and typography
- **Interactive States**: Hover, focus, and loading states
- **Error Styling**: Clear error message display

## 🚀 Demo

Visit `/dynamic-form-demo` to see the system in action with three example templates:

1. **Simple Invoice**: Basic invoice with items
2. **Detailed Invoice**: Comprehensive invoice with all fields
3. **Service Invoice**: Service-based invoice template

## 🔧 Integration

### With n8n Webhook

```typescript
const handleSubmit = async (data: InvoiceFormValues) => {
  try {
    const response = await fetch('/api/n8n/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      console.log('Invoice sent to n8n successfully');
    }
  } catch (error) {
    console.error('Error sending to n8n:', error);
  }
};
```

### With Supabase

```typescript
const handleSubmit = async (data: InvoiceFormValues) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      user_id: user.id
    });
    
  if (error) {
    console.error('Error saving invoice:', error);
  }
};
```

## 🧪 Testing

### Unit Tests

```typescript
import { parseTemplatePlaceholders, inferFieldType } from '@/utils/schemaParser';

describe('Schema Parser', () => {
  test('extracts placeholders correctly', () => {
    const template = 'Invoice #{{invoice_number}} for {{client_name}}';
    const placeholders = parseTemplatePlaceholders(template);
    expect(placeholders).toEqual(['invoice_number', 'client_name']);
  });
  
  test('infers field types correctly', () => {
    expect(inferFieldType('client_email')).toBe('email');
    expect(inferFieldType('invoice_date')).toBe('date');
    expect(inferFieldType('grand_total')).toBe('number');
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicInvoiceForm } from '@/components/DynamicInvoiceForm';

test('renders form fields correctly', () => {
  const schema = {
    invoice_number: 'string',
    client_name: 'string'
  };
  
  render(<DynamicInvoiceForm schema={schema} onSubmit={jest.fn()} />);
  
  expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
});
```

## 🔄 Future Enhancements

### Planned Features

1. **File Upload Support**: Handle file uploads in templates
2. **Conditional Fields**: Show/hide fields based on conditions
3. **Custom Field Types**: Support for custom field types
4. **Drag & Drop**: Reorder items in arrays
5. **Template Editor**: Visual template editor
6. **Export Options**: PDF, Excel, CSV export
7. **Multi-language**: Internationalization support
8. **Offline Support**: Work offline with local storage

### Extensibility

The system is designed to be easily extensible:

```typescript
// Add custom field type
interface CustomField extends FormField {
  type: 'custom';
  component: React.ComponentType<any>;
  props: Record<string, any>;
}

// Add custom validation
const customValidation = {
  custom: (value: any) => {
    // Custom validation logic
    return value.length > 10 ? 'Too long' : null;
  }
};
```

## 📞 Support

For questions or issues:

1. Check the demo at `/dynamic-form-demo`
2. Review the TypeScript types in `src/types/invoice.ts`
3. Examine the example usage in `DynamicInvoiceFormExample`
4. Look at the template parsing utilities in `src/utils/schemaParser.ts`

## 📄 License

This dynamic form system is part of the Alpha Pro application and follows the same licensing terms.
