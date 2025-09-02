import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DynamicInvoiceForm } from '@/components/DynamicInvoiceForm';
import { InvoiceFormSchema } from '@/types/invoice';
import { parseTemplateToSchema } from '@/utils/schemaParser';
import { FileText, Code, Play, Download } from 'lucide-react';

const DynamicFormDemo: React.FC = () => {
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Example templates
  const exampleTemplates = {
    simple: `
      Invoice #{{invoice_number}}
      Date: {{invoice_date}}
      Due: {{due_date}}
      
      Client: {{client_name}}
      Email: {{client_email}}
      
      Items:
      {{#each items}}
        {{description}} - Qty: {{quantity}} @ ${{unit_price}} = ${{total}}
      {{/each}}
      
      Total: ${{grand_total}}
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

  const handleSubmit = async (data: any) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmittedData(data);
    setLoading(false);
    
    console.log('Form submitted:', data);
  };

  const generateSchemaFromTemplate = (template: string): InvoiceFormSchema => {
    return parseTemplateToSchema(template);
  };

  const downloadJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dynamic Invoice Form Generator
          </h1>
          <p className="text-gray-600">
            Automatically generate forms from invoice templates with placeholders
          </p>
        </div>

        <Tabs defaultValue="simple" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simple">Simple Invoice</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Invoice</TabsTrigger>
            <TabsTrigger value="service">Service Invoice</TabsTrigger>
          </TabsList>

          {Object.entries(exampleTemplates).map(([key, template]) => (
            <TabsContent key={key} value={key} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Template Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {template}
                      </pre>
                    </div>
                    <div className="mt-4">
                      <Badge variant="secondary">
                        {Object.keys(generateSchemaFromTemplate(template)).length} fields detected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Generated Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generated Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicInvoiceForm
                      schema={generateSchemaFromTemplate(template)}
                      onSubmit={handleSubmit}
                      loading={loading}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Submitted Data Display */}
        {submittedData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Submitted Data
                </span>
                <Button
                  onClick={() => downloadJSON(submittedData)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔄 Dynamic Field Generation</h3>
                <p className="text-sm text-gray-600">
                  Automatically creates form fields based on template placeholders
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📊 Array Support</h3>
                <p className="text-sm text-gray-600">
                  Handles dynamic arrays like invoice items with add/remove functionality
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">✅ Validation</h3>
                <p className="text-sm text-gray-600">
                  Built-in validation for email, numbers, dates, and required fields
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🎨 Clean UI</h3>
                <p className="text-sm text-gray-600">
                  Modern, responsive design with Tailwind CSS styling
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔧 TypeScript</h3>
                <p className="text-sm text-gray-600">
                  Fully typed with TypeScript for better development experience
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📦 Modular</h3>
                <p className="text-sm text-gray-600">
                  Reusable components for different field types and arrays
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DynamicFormDemo;
