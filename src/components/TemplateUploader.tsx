import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  File, 
  AlertCircle, 
  CheckCircle, 
  Code,
  Download,
  Eye
} from 'lucide-react';
import { parseTemplatePlaceholders, validateSchema, getSchemaStats } from '@/utils/placeholderParser';
import { InvoiceFormSchema } from '@/types/invoice';

interface TemplateUploaderProps {
  onSchemaGenerated: (schema: InvoiceFormSchema) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  onSchemaGenerated,
  onError,
  className = ''
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [generatedSchema, setGeneratedSchema] = useState<InvoiceFormSchema | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const content = await readFileContent(file);
      setFileContent(content);

      // Parse the template and generate schema
      const schema = parseTemplatePlaceholders(content);
      const validation = validateSchema(schema);

      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      setGeneratedSchema(schema);
      onSchemaGenerated(schema);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process template';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [onSchemaGenerated, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          resolve(content);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
      case 'htm':
        return <FileText className="h-8 w-8" />;
      case 'docx':
        return <File className="h-8 w-8" />;
      case 'odt':
        return <File className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getFileTypeLabel = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
      case 'htm':
        return 'HTML Template';
      case 'docx':
        return 'Word Document';
      case 'odt':
        return 'OpenDocument Text';
      default:
        return 'Text File';
    }
  };

  const downloadSchema = () => {
    if (!generatedSchema) return;
    
    const blob = new Blob([JSON.stringify(generatedSchema, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewSchema = () => {
    if (!generatedSchema) return;
    
    const stats = getSchemaStats(generatedSchema);
    console.log('Generated Schema:', generatedSchema);
    console.log('Schema Statistics:', stats);
    
    alert(`Schema Preview:\n\nTotal Fields: ${stats.totalFields}\nArray Fields: ${stats.arrayFields}\nString Fields: ${stats.stringFields}\nNumber Fields: ${stats.numberFields}\nDate Fields: ${stats.dateFields}\nEmail Fields: ${stats.emailFields}\n\nCheck console for full schema.`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Template File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Processing template...</p>
              </div>
            ) : uploadedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {getFileTypeIcon(uploadedFile.name)}
                  <div className="text-left">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getFileTypeLabel(uploadedFile.name)} • {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Drop a new file to replace, or click to select
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop the template here' : 'Drag & drop template file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to select file
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">HTML</Badge>
                  <Badge variant="secondary">DOCX</Badge>
                  <Badge variant="secondary">ODT</Badge>
                  <Badge variant="secondary">TXT</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Schema Display */}
      {generatedSchema && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Schema Generated Successfully
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={previewSchema}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={downloadSchema}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Schema Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(getSchemaStats(generatedSchema)).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Schema Preview */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">Generated Schema Preview</span>
                </div>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(generatedSchema, null, 2)}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => onSchemaGenerated(generatedSchema)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Use This Schema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Content Preview */}
      {fileContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Content Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                {fileContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
