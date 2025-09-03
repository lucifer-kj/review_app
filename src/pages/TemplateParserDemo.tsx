import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TemplateUploader } from '@/components/TemplateUploader';
import { DynamicInvoiceForm } from '@/components/DynamicInvoiceForm';
import { InvoiceFormSchema } from '@/types/invoice';
import { parseTemplatePlaceholders, testPlaceholderParser } from '@/utils/placeholderParser';
import { 
  Upload, 
  Code, 
  Play, 
  Download, 
  FileText, 
  Settings,
  TestTube,
  Zap
} from 'lucide-react';

const TemplateParserDemo: React.FC = () => {
  const [currentSchema, setCurrentSchema] = useState<InvoiceFormSchema | null>(null);
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  // Example templates for testing
  const exampleTemplates = {
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

  const handleSchemaGenerated = (schema: InvoiceFormSchema) => {
    setCurrentSchema(schema);
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmittedData(data);
    setLoading(false);
  };

  const testParser = () => {
    testPlaceholderParser();
  };

  const generateSchemaFromTemplate = (template: string) => {
    const schema = parseTemplatePlaceholders(template);
    setCurrentSchema(schema);
  };

  const downloadTemplate = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-template.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Template Parser & Dynamic Form Generator
          </h1>
          <p className="text-gray-600">
            Upload invoice templates and automatically generate dynamic forms
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Template</TabsTrigger>
            <TabsTrigger value="examples">Example Templates</TabsTrigger>
            <TabsTrigger value="generated">Generated Form</TabsTrigger>
            <TabsTrigger value="testing">Parser Testing</TabsTrigger>
          </TabsList>

          {/* Upload Template Tab */}
          <TabsContent value="upload" className="space-y-6">
            <TemplateUploader
              onSchemaGenerated={handleSchemaGenerated}
              onError={(error) => console.error('Upload error:', error)}
            />
          </TabsContent>

          {/* Example Templates Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(exampleTemplates).map(([name, template]) => (
                <Card key={name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{name} Template</span>
                      <Button
                        onClick={() => downloadTemplate(name, template)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-auto">
                        {template}
                      </pre>
                    </div>
                    <Button
                      onClick={() => generateSchemaFromTemplate(template)}
                      className="w-full flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Generate Schema
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Generated Form Tab */}
          <TabsContent value="generated" className="space-y-6">
            {currentSchema ? (
              <div className="space-y-6">
                {/* Schema Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Generated Schema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-auto max-h-40">
                        {JSON.stringify(currentSchema, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Dynamic Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Dynamic Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicInvoiceForm
                      schema={currentSchema}
                      onSubmit={handleFormSubmit}
                      loading={loading}
                    />
                  </CardContent>
                </Card>

                {/* Submitted Data */}
                {submittedData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Submitted Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm overflow-auto max-h-40">
                          {JSON.stringify(submittedData, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Schema Generated</h3>
                  <p className="text-muted-foreground">
                    Upload a template file or use an example template to generate a schema
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Parser Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Parser Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Test the placeholder parser with various template formats and see the results in the console.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={testParser}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Run Parser Tests
                  </Button>
                  
                  <Button
                    onClick={() => {
                      Object.entries(exampleTemplates).forEach(([name, template]) => {
                        console.log(`\n=== Testing ${name} template ===`);
                        const schema = parseTemplatePlaceholders(template);
                        console.log('Generated schema:', schema);
                      });
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    Test All Examples
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Test Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the browser console to see detailed test results and generated schemas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Template Parser Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📁 File Upload Support</h3>
                <p className="text-sm text-gray-600">
                  Upload HTML, DOCX, ODT, and TXT files with drag & drop
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                                  <h3 className="font-semibold mb-2">🔍 Placeholder Detection</h3>
                  <p className="text-sm text-gray-600">
                    Automatically extracts {'{{placeholders}}'} from templates
                  </p>
              </div>
              <div className="p-4 border rounded-lg">
                                  <h3 className="font-semibold mb-2">📊 Array Support</h3>
                  <p className="text-sm text-gray-600">
                    Detects {'{{#each items}}'} blocks and generates nested schemas
                  </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🎯 Type Inference</h3>
                <p className="text-sm text-gray-600">
                  Intelligently infers field types (string, number, date, email)
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">✅ Schema Validation</h3>
                <p className="text-sm text-gray-600">
                  Validates generated schemas for correctness
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📈 Statistics</h3>
                <p className="text-sm text-gray-600">
                  Provides detailed statistics about generated schemas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TemplateParserDemo;
