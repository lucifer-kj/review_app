import { InvoiceFormSchema, ArrayField, FormField } from '@/types/invoice';

// Interface for parsed placeholder data
interface ParsedPlaceholder {
  name: string;
  type: 'string' | 'number' | 'date' | 'email';
  isArray: boolean;
  arrayName?: string;
  context?: string;
}

// Interface for array block data
interface ArrayBlock {
  name: string;
  placeholders: ParsedPlaceholder[];
  content: string;
}

/**
 * Extracts all placeholders from template content
 * @param fileContent - The template file content as string
 * @returns Array of parsed placeholders
 */
export function extractPlaceholders(fileContent: string): ParsedPlaceholder[] {
  const placeholders: ParsedPlaceholder[] = [];
  
  // Regex to match {{placeholder}} patterns
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = placeholderRegex.exec(fileContent)) !== null) {
    const placeholder = match[1].trim();
    
    // Skip control structures like #each, #if, etc.
    if (placeholder.startsWith('#') || placeholder.startsWith('/')) {
      continue;
    }
    
    // Determine if this is part of an array block
    const isArray = isInsideArrayBlock(fileContent, match.index);
    const arrayName = isArray ? getArrayName(fileContent, match.index) : undefined;
    
    placeholders.push({
      name: placeholder,
      type: inferFieldType(placeholder),
      isArray,
      arrayName,
      context: getPlaceholderContext(fileContent, match.index)
    });
  }
  
  return placeholders;
}

/**
 * Infers the field type based on placeholder name and context
 * @param placeholder - The placeholder name
 * @returns Inferred field type
 */
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
}

/**
 * Checks if a placeholder is inside an array block
 * @param content - The template content
 * @param position - Position of the placeholder
 * @returns True if inside array block
 */
function isInsideArrayBlock(content: string, position: number): boolean {
  const beforeContent = content.substring(0, position);
  const afterContent = content.substring(position);
  
  // Look for {{#each ...}} before the position
  const eachStart = beforeContent.lastIndexOf('{{#each');
  if (eachStart === -1) return false;
  
  // Look for {{/each}} after the position
  const eachEnd = afterContent.indexOf('{{/each}}');
  if (eachEnd === -1) return false;
  
  // Check if there's a closing {{/each}} before the next {{#each}}
  const nextEachStart = afterContent.indexOf('{{#each', eachEnd);
  if (nextEachStart !== -1 && nextEachStart < eachEnd) return false;
  
  return true;
}

/**
 * Gets the array name from the #each block
 * @param content - The template content
 * @param position - Position of the placeholder
 * @returns Array name or undefined
 */
function getArrayName(content: string, position: number): string | undefined {
  const beforeContent = content.substring(0, position);
  const eachStart = beforeContent.lastIndexOf('{{#each');
  if (eachStart === -1) return undefined;
  
  const eachEnd = beforeContent.indexOf('}}', eachStart);
  if (eachEnd === -1) return undefined;
  
  const eachContent = beforeContent.substring(eachStart + 7, eachEnd).trim();
  return eachContent;
}

/**
 * Gets context around the placeholder for better type inference
 * @param content - The template content
 * @param position - Position of the placeholder
 * @returns Context string
 */
function getPlaceholderContext(content: string, position: number): string {
  const start = Math.max(0, position - 50);
  const end = Math.min(content.length, position + 50);
  return content.substring(start, end);
}

/**
 * Extracts array blocks from template content
 * @param fileContent - The template file content
 * @returns Array of array blocks
 */
export function extractArrayBlocks(fileContent: string): ArrayBlock[] {
  const arrayBlocks: ArrayBlock[] = [];
  
  // Regex to match {{#each arrayName}} ... {{/each}} blocks
  const eachBlockRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  let match;
  
  while ((match = eachBlockRegex.exec(fileContent)) !== null) {
    const arrayName = match[1];
    const blockContent = match[2];
    
    // Extract placeholders from this block
    const placeholders = extractPlaceholders(blockContent);
    
    arrayBlocks.push({
      name: arrayName,
      placeholders: placeholders.map(p => ({ ...p, isArray: true, arrayName })),
      content: blockContent
    });
  }
  
  return arrayBlocks;
}

/**
 * Generates form schema from parsed placeholders
 * @param placeholders - Array of parsed placeholders
 * @param arrayBlocks - Array of array blocks
 * @returns Generated form schema
 */
export function generateFormSchema(
  placeholders: ParsedPlaceholder[], 
  arrayBlocks: ArrayBlock[]
): InvoiceFormSchema {
  const schema: InvoiceFormSchema = {};
  
  // Process regular (non-array) placeholders
  const regularPlaceholders = placeholders.filter(p => !p.isArray);
  regularPlaceholders.forEach(placeholder => {
    schema[placeholder.name] = placeholder.type;
  });
  
  // Process array blocks
  arrayBlocks.forEach(block => {
    const arrayField: ArrayField = {
      name: block.name,
      type: 'array',
      items: block.placeholders.map(placeholder => ({
        name: placeholder.name,
        type: placeholder.type,
        label: generateFieldLabel(placeholder.name),
        required: true
      }))
    };
    
    schema[block.name] = arrayField;
  });
  
  return schema;
}

/**
 * Generates human-readable field label from placeholder name
 * @param placeholder - The placeholder name
 * @returns Human-readable label
 */
export function generateFieldLabel(placeholder: string): string {
  return placeholder
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Main function to parse template placeholders and generate schema
 * @param fileContent - The template file content as string
 * @returns Generated JSON schema for DynamicInvoiceForm
 */
export function parseTemplatePlaceholders(fileContent: string): InvoiceFormSchema {
  // Extract all placeholders
  const placeholders = extractPlaceholders(fileContent);
  
  // Extract array blocks
  const arrayBlocks = extractArrayBlocks(fileContent);
  
  // Generate the final schema
  const schema = generateFormSchema(placeholders, arrayBlocks);
  
  return schema;
}

/**
 * Enhanced parser that handles different file formats
 * @param fileContent - The template file content
 * @param fileType - The file type (html, docx, odt)
 * @returns Generated JSON schema
 */
export function parseTemplateFile(fileContent: string, fileType: 'html' | 'docx' | 'odt' = 'html'): InvoiceFormSchema {
  let processedContent = fileContent;
  
  // For now, we assume the content is already extracted as text
  // In a real implementation, you would use libraries like mammoth for .docx
  // and appropriate libraries for .odt files
  
  if (fileType === 'docx') {
    // TODO: Use mammoth.js to extract text from .docx
    // processedContent = await mammoth.extractRawText({ buffer: fileContent });
    console.log('DOCX parsing would require mammoth.js library');
  }
  
  if (fileType === 'odt') {
    // TODO: Use appropriate library to extract text from .odt
    console.log('ODT parsing would require appropriate library');
  }
  
  return parseTemplatePlaceholders(processedContent);
}

/**
 * Validates the generated schema
 * @param schema - The generated schema
 * @returns Validation result
 */
export function validateSchema(schema: InvoiceFormSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!schema || Object.keys(schema).length === 0) {
    errors.push('Schema is empty or invalid');
  }
  
  Object.entries(schema).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (!['string', 'number', 'date', 'email'].includes(value)) {
        errors.push(`Invalid field type for ${key}: ${value}`);
      }
    } else if (value.type === 'array') {
      if (!Array.isArray(value.items)) {
        errors.push(`Array field ${key} must have items array`);
      }
    } else {
      errors.push(`Invalid field configuration for ${key}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Utility function to get schema statistics
 * @param schema - The generated schema
 * @returns Statistics about the schema
 */
export function getSchemaStats(schema: InvoiceFormSchema): {
  totalFields: number;
  arrayFields: number;
  stringFields: number;
  numberFields: number;
  dateFields: number;
  emailFields: number;
} {
  const stats = {
    totalFields: 0,
    arrayFields: 0,
    stringFields: 0,
    numberFields: 0,
    dateFields: 0,
    emailFields: 0
  };
  
  Object.values(schema).forEach(value => {
    stats.totalFields++;
    
    if (typeof value === 'string') {
      switch (value) {
        case 'string':
          stats.stringFields++;
          break;
        case 'number':
          stats.numberFields++;
          break;
        case 'date':
          stats.dateFields++;
          break;
        case 'email':
          stats.emailFields++;
          break;
      }
    } else if (value.type === 'array') {
      stats.arrayFields++;
    }
  });
  
  return stats;
}

// Example usage and test cases
export const exampleTemplates = {
  simple: `
    Invoice Number: {{invoice_number}}
    Invoice Date: {{invoice_date}}
    Bill To: {{client_name}}, {{client_email}}
    {{#each items}}
    {{description}} | {{quantity}} | {{unit_price}} | {{total}}
    {{/each}}
    Grand Total: {{grand_total}}
  `,
  
  detailed: `
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
  `,
  
  service: `
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
  `
};

/**
 * Test function to demonstrate the parser
 */
export function testPlaceholderParser(): void {
  console.log('=== Testing Placeholder Parser ===\n');
  
  Object.entries(exampleTemplates).forEach(([name, template]) => {
    console.log(`Testing ${name} template:`);
    
    const schema = parseTemplatePlaceholders(template);
    const stats = getSchemaStats(schema);
    const validation = validateSchema(schema);
    
    console.log('Generated Schema:', JSON.stringify(schema, null, 2));
    console.log('Schema Stats:', stats);
    console.log('Validation:', validation);
    console.log('---\n');
  });
}
