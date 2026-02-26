import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, FileText, BookOpen, Trash2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useMe } from '@/hooks/useMe';
import { useText } from '@/context/TextContext';
import { listDocuments, deleteDocument, type Document } from '@/lib/api/documents';
import { getSignedUrl, deleteFile } from '@/lib/api/storage';
import { extractPdfText } from '@/lib/pdf';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { me, loading: authLoading } = useMe();
  const { setOriginalText, setPdfState } = useText();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const docs = await listDocuments(me.id);
      setDocuments(docs);
    } catch {
      toast.error('Failed to load your library');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    if (me) {
      fetchDocuments();
    }
  }, [me, fetchDocuments]);

  const handleLoad = async (doc: Document) => {
    if (!doc.file_path) {
      toast.error('This document has no stored file');
      return;
    }

    setLoadingId(doc.id);
    try {
      const signedUrl = await getSignedUrl(doc.file_path);

      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error('Failed to download file');
      const blob = await response.blob();

      const file = new File([blob], `${doc.title}.pdf`, { type: 'application/pdf' });
      const text = await extractPdfText(file);

      setOriginalText(text);
      setPdfState({
        file,
        name: `${doc.title}.pdf`,
        size: file.size,
        url: doc.file_path ?? undefined,
      });

      toast.success(`"${doc.title}" loaded — opening reader`);
      navigate('/read');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (doc: Document) => {
    setDeletingId(doc.id);
    try {
      if (doc.file_path) {
        await deleteFile(doc.file_path);
      }
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success(`"${doc.title}" deleted`);
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="app" />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <Library className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">My Library</h1>
          </div>

          {/* Unauthenticated state */}
          {!authLoading && !me && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <LogIn className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-medium">Sign in to view your saved files</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your uploaded PDFs are saved to your account and accessible from any device.
              </p>
              <Button asChild>
                <Link to="/auth/login">Log in</Link>
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {(authLoading || (me && loading)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!authLoading && me && !loading && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-medium">No saved files yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Upload a PDF on the Read page and it will appear here automatically.
              </p>
              <Button variant="outline" asChild>
                <Link to="/read">Go to Read</Link>
              </Button>
            </div>
          )}

          {/* Document grid */}
          {!authLoading && me && !loading && documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-card rounded-lg border p-4 flex flex-col gap-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-snug line-clamp-2 break-words">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={loadingId === doc.id || !doc.file_path}
                      onClick={() => handleLoad(doc)}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                      {loadingId === doc.id ? 'Loading...' : 'Open'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc)}
                      aria-label={`Delete ${doc.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
