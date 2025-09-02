# Template Parser & Dynamic Form Generator

A comprehensive system that automatically extracts placeholders from invoice templates and generates dynamic forms.

## 🚀 Overview

This system extends the Dynamic Invoice Form Generator with a powerful template parser that can:

- **Upload Template Files**: Support for HTML, DOCX, ODT, and TXT files
- **Extract Placeholders**: Automatically detect `{{placeholders}}` from templates
- **Parse Array Blocks**: Handle `{{#each items}}` loops and generate nested schemas
- **Type Inference**: Intelligently determine field types (string, number, date, email)
- **Generate Schemas**: Create JSON schemas ready for the DynamicInvoiceForm

## 📁 File Structure

```
src/
├── components/
│   ├── TemplateUploader.tsx      # File upload component with drag & drop
│   ├── DynamicInvoiceForm.tsx    # Main form component
│   ├── FormField.tsx             # Individual field component
│   └── DynamicTable.tsx          # Array field component
├── utils/
│   ├── placeholderParser.ts      # Core parsing logic
│   └── schemaParser.ts          # Legacy parser (still useful)
├── types/
│   └── invoice.ts               # TypeScript type definitions
└── pages/
    ├── TemplateParserDemo.tsx   # Complete demo with upload
    └── DynamicFormDemo.tsx     # Basic form demo
```

## 🎯 Core Features

### 1. **File Upload Support**
- Drag & drop interface
- Support for multiple file formats:
  - **HTML** (.html, .htm) - Direct text extraction
  - **DOCX** (.docx) - Word documents (requires mammoth.js)
  - **ODT** (.odt) - OpenDocument text (requires appropriate library)
  - **TXT** (.txt) - Plain text files

### 2. **Placeholder Detection**
- Regex-based extraction: `/\{\{([^}]+)\}\}/g`
- Handles nested structures
- Skips control structures (`{{#each}}`, `{{/each}}`, etc.)
- Context-aware parsing

### 3. **Array Block Parsing**
- Detects `{{#each arrayName}}` blocks
- Extracts placeholders within loops
- Generates nested array schemas
- Supports multiple array types (items, services, products, etc.)

### 4. **Type Inference**
Intelligent type detection based on placeholder names:

```typescript
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
  lowerPlaceholder.includes('qty') ||
  lowerPlaceholder.includes('price') ||
  lowerPlaceholder.includes('amount') ||
  lowerPlaceholder.includes('total') ||
  lowerPlaceholder.includes('count') ||
  lowerPlaceholder.includes('rate') ||
  lowerPlaceholder.includes('hours') ||
  lowerPlaceholder.includes('cost')
) {
  return 'number';
}

// Default to string
return 'string';
```

## 🔧 Usage Examples

### Basic Usage

```typescript
import { parseTemplatePlaceholders } from '@/utils/placeholderParser';

const template = `
  Invoice Number: {{invoice_number}}
  Invoice Date: {{invoice_date}}
  Bill To: {{client_name}}, {{client_email}}
  {{#each items}}
  {{description}} | {{quantity}} | {{unit_price}} | {{total}}
  {{/each}}
  Grand Total: {{grand_total}}
`;

const schema = parseTemplatePlaceholders(template);
console.log(schema);
```

### Expected Output

```json
{
  "invoice_number": "string",
  "invoice_date": "date",
  "client_name": "string",
  "client_email": "email",
  "items": {
    "name": "items",
    "type": "array",
    "items": [
      { "name": "description", "type": "string", "label": "Description", "required": true },
      { "name": "quantity", "type": "number", "label": "Quantity", "required": true },
      { "name": "unit_price", "type": "number", "label": "Unit Price", "required": true },
      { "name": "total", "type": "number", "label": "Total", "required": true }
    ]
  },
  "grand_total": "number"
}
```

### File Upload Usage

```typescript
import { TemplateUploader } from '@/components/TemplateUploader';

const handleSchemaGenerated = (schema: InvoiceFormSchema) => {
  console.log('Generated schema:', schema);
  // Use the schema with DynamicInvoiceForm
};

<TemplateUploader
  onSchemaGenerated={handleSchemaGenerated}
  onError={(error) => console.error('Upload error:', error)}
/>
```

## 📊 Template Examples

### Simple Invoice Template

```html
Invoice Number: {{invoice_number}}
Invoice Date: {{invoice_date}}
Bill To: {{client_name}}, {{client_email}}

{{#each items}}
{{description}} | {{quantity}} | {{unit_price}} | {{total}}
{{/each}}

Grand Total: {{grand_total}}
```

### Detailed Invoice Template

```html
INVOICE
=======

Invoice Number: {{invoice_number}}
Issue Date: {{invoice_date}}
Due Date: {{due_date}}

BILL TO:
{{client_name}}
{{client_address}}
{{client_email}}
{{client_phone}}

ITEMS:
{{#each items}}
  Description: {{description}}
  Quantity: {{quantity}}
  Unit Price: ${{unit_price}}
  Total: ${{total}}
{{/each}}

Subtotal: ${{subtotal}}
Tax: ${{tax_amount}}
Grand Total: ${{grand_total}}

Notes: {{notes}}
```

### Service Invoice Template

```html
SERVICE INVOICE
===============

Service Provider: {{provider_name}}
Invoice #: {{invoice_number}}
Date: {{invoice_date}}

Client: {{client_name}}
Project: {{project_name}}

Services:
{{#each services}}
  {{service_name}} - {{hours}} hours @ ${{hourly_rate}} = ${{total}}
{{/each}}

Total Hours: {{total_hours}}
Total Amount: ${{total_amount}}
```

## 🔍 Parser Functions

### Core Functions

#### `parseTemplatePlaceholders(fileContent: string): InvoiceFormSchema`
Main function that orchestrates the entire parsing process.

#### `extractPlaceholders(fileContent: string): ParsedPlaceholder[]`
Extracts all placeholders from template content.

#### `extractArrayBlocks(fileContent: string): ArrayBlock[]`
Extracts array blocks (`{{#each}}`) from template content.

#### `inferFieldType(placeholder: string): FieldType`
Infers the field type based on placeholder name.

#### `validateSchema(schema: InvoiceFormSchema): ValidationResult`
Validates the generated schema for correctness.

#### `getSchemaStats(schema: InvoiceFormSchema): SchemaStats`
Provides statistics about the generated schema.

### Utility Functions

#### `parseTemplateFile(fileContent: string, fileType: string): InvoiceFormSchema`
Enhanced parser that handles different file formats.

#### `generateFieldLabel(placeholder: string): string`
Generates human-readable field labels from placeholder names.

## 🎨 Components

### TemplateUploader

A comprehensive file upload component with:

- **Drag & Drop**: Intuitive file upload interface
- **File Type Detection**: Automatic file type recognition
- **Progress Indicators**: Loading states and error handling
- **Schema Preview**: Real-time schema generation and preview
- **Statistics Display**: Detailed schema statistics
- **Download Options**: Export generated schemas as JSON

**Props:**
```typescript
interface TemplateUploaderProps {
  onSchemaGenerated: (schema: InvoiceFormSchema) => void;
  onError?: (error: string) => void;
  className?: string;
}
```

### DynamicInvoiceForm

The main form component that renders based on the generated schema.

**Props:**
```typescript
interface DynamicInvoiceFormProps {
  schema: InvoiceFormSchema;
  onSubmit: (data: InvoiceFormValues) => void;
  loading?: boolean;
  className?: string;
}
```

## 🧪 Testing

### Built-in Test Function

```typescript
import { testPlaceholderParser } from '@/utils/placeholderParser';

// Run comprehensive tests
testPlaceholderParser();
```

### Manual Testing

```typescript
// Test individual templates
const template = `Invoice #{{invoice_number}} for {{client_name}}`;
const schema = parseTemplatePlaceholders(template);
console.log('Generated schema:', schema);

// Test validation
const validation = validateSchema(schema);
console.log('Validation result:', validation);

// Get statistics
const stats = getSchemaStats(schema);
console.log('Schema statistics:', stats);
```

## 🚀 Demo Pages

### `/template-parser-demo`
Complete demo with:
- File upload functionality
- Example templates
- Generated form display
- Parser testing tools

### `/dynamic-form-demo`
Basic form demo with:
- Pre-defined schemas
- Form rendering
- Data submission

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

## 🔄 Advanced Features

### Custom Type Inference

You can extend the type inference logic:

```typescript
// Add custom type detection
function customInferFieldType(placeholder: string): FieldType {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  // Custom rules
  if (lowerPlaceholder.includes('custom_field')) {
    return 'string'; // or your custom type
  }
  
  // Fall back to default inference
  return inferFieldType(placeholder);
}
```

### Custom Validation Rules

```typescript
// Add custom validation
const customValidation = {
  custom: (value: any) => {
    // Custom validation logic
    if (value.length > 100) {
      return 'Field too long';
    }
    return null;
  }
};
```

### File Format Extensions

To support additional file formats:

```typescript
// For DOCX files (requires mammoth.js)
if (fileType === 'docx') {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer: fileContent });
  processedContent = result.value;
}

// For ODT files (requires appropriate library)
if (fileType === 'odt') {
  // Use appropriate ODT parsing library
  processedContent = await parseODT(fileContent);
}
```

## 📈 Performance Considerations

### Large Files
- Implement streaming for large files
- Add file size limits
- Use Web Workers for heavy parsing

### Memory Usage
- Process files in chunks
- Clean up file references
- Implement proper error handling

### Caching
- Cache parsed schemas
- Store template metadata
- Implement schema versioning

## 🔒 Security Considerations

### File Upload Security
- Validate file types
- Check file size limits
- Sanitize file content
- Implement virus scanning

### Schema Validation
- Validate generated schemas
- Prevent injection attacks
- Sanitize placeholder names

## 🚨 Error Handling

### Common Errors

1. **Invalid File Format**
   ```typescript
   try {
     const schema = parseTemplateFile(content, fileType);
   } catch (error) {
     console.error('Unsupported file format:', error);
   }
   ```

2. **Malformed Template**
   ```typescript
   const validation = validateSchema(schema);
   if (!validation.valid) {
     console.error('Schema validation failed:', validation.errors);
   }
   ```

3. **Missing Placeholders**
   ```typescript
   if (Object.keys(schema).length === 0) {
     console.warn('No placeholders found in template');
   }
   ```

## 📞 Support

### Debugging

1. **Check Console**: All parsing results are logged to console
2. **Use Test Function**: Run `testPlaceholderParser()` for comprehensive testing
3. **Validate Schemas**: Use `validateSchema()` to check generated schemas
4. **Check File Content**: Verify uploaded file content is correct

### Common Issues

1. **No Placeholders Detected**
   - Check template syntax (use `{{placeholder}}`)
   - Verify file encoding
   - Ensure file content is readable

2. **Incorrect Type Inference**
   - Review placeholder naming conventions
   - Add custom type inference rules
   - Check context around placeholders

3. **Array Blocks Not Parsed**
   - Verify `{{#each}}` syntax
   - Check for proper closing `{{/each}}`
   - Ensure array name is valid

## 📄 License

This template parser system is part of the Alpha Pro application and follows the same licensing terms.

## 🔄 Future Enhancements

### Planned Features

1. **Visual Template Editor**: Drag-and-drop template builder
2. **Advanced Type Inference**: Machine learning-based type detection
3. **Template Library**: Pre-built template collection
4. **Version Control**: Template versioning and history
5. **Collaboration**: Multi-user template editing
6. **Export Options**: PDF, Excel, CSV export
7. **Multi-language**: Internationalization support
8. **Offline Support**: Work offline with local storage

### Extensibility

The system is designed to be easily extensible:

```typescript
// Add custom file format support
export function parseCustomFormat(content: string): string {
  // Custom parsing logic
  return processedContent;
}

// Add custom type detection
export function customTypeInference(placeholder: string): FieldType {
  // Custom type inference logic
  return inferredType;
}
```
