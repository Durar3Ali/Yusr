import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { extractPdfText } from '@/lib/pdf';
import { toast } from 'sonner';
import { useMe } from '@/hooks/useMe';
import { useText } from '@/context/TextContext';
import { uploadPdf } from '@/lib/api/storage';
import { createDocument } from '@/lib/api/documents';

interface TextUploaderProps {
  onTextChange: (text: string) => void;
  originalText: string;
}

export function TextUploader({ onTextChange, originalText }: TextUploaderProps) {
  const { setPdfState } = useText();
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { authUser, me } = useMe();

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
    setStatus('idle');
    setFileName('');
    setFileSize(0);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setStatus('extracting');

    try {
      const text = await extractPdfText(file);
      onTextChange(text);
      setStatus('success');

      // Store initial PDF state (no URL yet)
      setPdfState({ file, name: file.name, size: file.size });

      // If user is logged in, upload PDF and save document to Supabase
      if (authUser && me) {
        try {
          const filePath = await uploadPdf(file, authUser.id);
          await createDocument({
            user_id: me.id,
            title: file.name.replace(/\.pdf$/i, ''),
            file_path: filePath,
          });

          // Update PDF state with the remote storage URL
          setPdfState({ file, name: file.name, size: file.size, url: filePath });

          toast.success('PDF uploaded and saved to your library');
        } catch (uploadError) {
          console.error('Failed to upload PDF:', uploadError);
          toast.warning('PDF extracted but failed to save to library');
        }
      } else {
        toast.success('PDF text extracted successfully');
      }
    } catch (error) {
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to extract PDF text');
      console.error('PDF extraction failed:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onTextChange('');
    setFileName('');
    setFileSize(0);
    setStatus('idle');
    setPdfState(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <Label htmlFor="text-input" className="text-base font-semibold">
          Input Text
        </Label>
        {originalText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            aria-label="Clear text"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Textarea
        id="text-input"
        placeholder="Paste your text here or upload a PDF below..."
        value={originalText}
        onChange={handleTextareaChange}
        className="min-h-[200px] font-mono text-sm"
        aria-label="Text input area"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
            aria-label="Upload PDF file"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'extracting'}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {status === 'extracting' ? 'Extracting...' : 'Upload PDF'}
          </Button>
        </div>

        {fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{fileName}</p>
              <p className="text-xs">{formatFileSize(fileSize)}</p>
            </div>
            {status === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Supported: Plain text paste or PDF upload. Text will be extracted automatically.
        </p>
      </div>
    </div>
  );
}
