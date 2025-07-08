'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { uploadAndProcessFile } from '@/app/(protected)/import/labor-rates/actions';
import { NormalizedRate } from '@/lib/rate-extraction/rate-normalizer';

interface LaborRateUploaderProps {
  onRatesExtracted: (rates: NormalizedRate[]) => void;
}

export function LaborRateUploader({ onRatesExtracted }: LaborRateUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadAndProcessFile(formData);

      if (!result.upload.success) {
        toast.error(result.upload.error || 'Failed to upload file');
        return;
      }

      if (result.processing) {
        if (result.processing.success && result.processing.rates.length > 0) {
          toast.success(
            `Extracted ${result.processing.stats.validRates} valid rates from ${result.processing.stats.totalExtracted} total`
          );
          onRatesExtracted(result.processing.rates);
          setFile(null);
        } else if (result.processing.rates.length === 0) {
          toast.warning('No labor rates found in the file');
        } else {
          toast.error('Failed to extract rates from the file');
        }

        // Show any processing errors
        if (result.processing.errors.length > 0) {
          console.error('Processing errors:', result.processing.errors);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const getFileIcon = (fileName: string) => {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Labor Rate Document</h3>
          <p className="text-sm text-muted-foreground">
            Upload Excel files containing labor rates. The system will automatically extract rates from trade breakup sheets and labor sections.
          </p>
        </div>

        {!file ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports Excel (.xlsx, .xls) files up to 10MB
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.name)}
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {file && (
          <Button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Extract Labor Rates'}
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Excel files should contain &quot;Trade Breakup&quot; or &quot;Labor&quot; sheets</li>
            <li>Rates should be in format like $X/hr, $X/day, $X/m²</li>
            <li>The system will categorize rates automatically</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}