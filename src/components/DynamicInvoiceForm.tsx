import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormField } from './FormField';
import { DynamicTable } from './DynamicTable';
import { InvoiceFormSchema, InvoiceFormValues, ArrayField } from '@/types/invoice';
import { FileText, Send, Loader2 } from 'lucide-react';

interface DynamicInvoiceFormProps {
  schema: InvoiceFormSchema;
  onSubmit: (data: InvoiceFormValues) => void;
  loading?: boolean;
  className?: string;
}

export const DynamicInvoiceForm: React.FC<DynamicInvoiceFormProps> = ({
  schema,
  onSubmit,
  loading = false,
  className = ''
}) => {
  // Generate Zod schema from the form schema
  const generateZodSchema = () => {
    const zodSchema: Record<string, any> = {};

    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
      if (typeof fieldConfig === 'string') {
        // Simple field type
        switch (fieldConfig) {
          case 'string':
            zodSchema[fieldName] = z.string().min(1, `${fieldName} is required`);
            break;
          case 'number':
            zodSchema[fieldName] = z.number().min(0, `${fieldName} must be positive`);
            break;
          case 'date':
            zodSchema[fieldName] = z.string().min(1, `${fieldName} is required`);
            break;
          case 'email':
            zodSchema[fieldName] = z.string().email('Invalid email address').min(1, `${fieldName} is required`);
            break;
        }
      } else if (fieldConfig.type === 'array') {
        // Array field
        const itemSchema: Record<string, any> = {};
        fieldConfig.items.forEach(item => {
          switch (item.type) {
            case 'string':
              itemSchema[item.name] = z.string().min(1, `${item.name} is required`);
              break;
            case 'number':
              itemSchema[item.name] = z.number().min(0, `${item.name} must be positive`);
              break;
            case 'date':
              itemSchema[item.name] = z.string().min(1, `${item.name} is required`);
              break;
            case 'email':
              itemSchema[item.name] = z.string().email('Invalid email address').min(1, `${item.name} is required`);
              break;
          }
        });
        zodSchema[fieldName] = z.array(z.object(itemSchema)).min(1, `At least one ${fieldName} is required`);
      }
    });

    return z.object(zodSchema);
  };

  const zodSchema = generateZodSchema();
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(zodSchema),
    defaultValues: generateDefaultValues(schema)
  });

  const handleSubmit = (data: InvoiceFormValues) => {
    // Process the data before submitting
    const processedData = processFormData(data);
    console.log('Form submitted with data:', processedData);
    onSubmit(processedData);
  };

  const generateDefaultValues = (schema: InvoiceFormSchema): Partial<InvoiceFormValues> => {
    const defaults: Partial<InvoiceFormValues> = {};

    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
      if (typeof fieldConfig === 'string') {
        switch (fieldConfig) {
          case 'string':
          case 'email':
            defaults[fieldName] = '';
            break;
          case 'number':
            defaults[fieldName] = 0;
            break;
          case 'date':
            defaults[fieldName] = new Date().toISOString().split('T')[0];
            break;
        }
      } else if (fieldConfig.type === 'array') {
        defaults[fieldName] = [];
      }
    });

    return defaults;
  };

  const processFormData = (data: InvoiceFormValues): InvoiceFormValues => {
    const processed = { ...data };

    // Process items array to calculate totals
    if (processed.items && Array.isArray(processed.items)) {
      processed.items = processed.items.map(item => ({
        ...item,
        total: (item.quantity || 0) * (item.unit_price || 0)
      }));
    }

    // Calculate grand total
    if (processed.items && Array.isArray(processed.items)) {
      processed.grand_total = processed.items.reduce((sum, item) => sum + (item.total || 0), 0);
    }

    return processed;
  };

  const renderField = (fieldName: string, fieldConfig: string | ArrayField) => {
    if (typeof fieldConfig === 'string') {
      // Simple field
      return (
        <FormField
          key={fieldName}
          name={fieldName}
          type={fieldConfig}
          label={fieldName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          required={true}
          className="col-span-1"
        />
      );
    } else if (fieldConfig.type === 'array') {
      // Array field
      return (
        <DynamicTable
          key={fieldName}
          field={fieldConfig}
          className="col-span-full"
        />
      );
    }
    return null;
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dynamic Invoice Form
          </CardTitle>
          <p className="text-muted-foreground">
            Fill in the invoice details below. Fields are automatically generated based on your template.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(schema).map(([fieldName, fieldConfig]) => 
                  renderField(fieldName, fieldConfig)
                )}
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Generate Invoice
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

// Usage example component
export const DynamicInvoiceFormExample: React.FC = () => {
  const exampleSchema: InvoiceFormSchema = {
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

  const handleSubmit = (data: InvoiceFormValues) => {
    console.log('Example form submitted:', data);
    // Here you would typically send the data to your backend
    alert('Form submitted! Check console for data.');
  };

  return (
    <div className="p-6">
      <DynamicInvoiceForm
        schema={exampleSchema}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
