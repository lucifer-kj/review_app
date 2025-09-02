// deno-lint-ignore-file
// @ts-ignore - Deno-specific imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TemplateData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  item_description: string;
  quantity: string;
  unit_price: string;
  total: string;
  currency: string;
  notes: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateUrl, templateData, invoiceId }: {
      templateUrl: string;
      templateData: TemplateData;
      invoiceId: string;
    } = await req.json();

    if (!templateUrl || !templateData) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Download the ODT template
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error("Failed to download template");
    }
    
    const templateBuffer = await templateResponse.arrayBuffer();
    
    // For now, we'll return a simple PDF generation response
    // In a production environment, you would use a library like LibreOffice
    // or a service like Pandoc to convert ODT to PDF with placeholder replacement
    
    // This is a placeholder implementation
    // You would need to implement actual ODT to PDF conversion
    const pdfContent = await generatePDFFromTemplate(templateBuffer, templateData);
    
    console.log("PDF generated for invoice:", invoiceId);

    return new Response(JSON.stringify({ 
      success: true,
      pdf: pdfContent,
      message: "PDF generated successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate PDF",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Placeholder function for PDF generation
// In production, this would use a proper ODT to PDF conversion library
async function generatePDFFromTemplate(templateBuffer: ArrayBuffer, data: TemplateData): Promise<string> {
  // This is a simplified implementation
  // In a real scenario, you would:
  // 1. Parse the ODT file
  // 2. Replace placeholders with actual data
  // 3. Convert to PDF using LibreOffice or similar
  
  // For now, we'll create a simple PDF structure
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(Invoice: ${data.invoice_number}) Tj
0 -20 Td
(Customer: ${data.customer_name}) Tj
0 -20 Td
(Amount: ${data.currency} ${data.total}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000525 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
612
%%EOF
  `;
  
  // Convert to base64
  return btoa(pdfContent);
}

serve(handler);
