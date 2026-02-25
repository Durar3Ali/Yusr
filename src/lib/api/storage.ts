import { supabase } from '@/lib/supabaseClient';

/**
 * Upload a PDF file to Supabase Storage
 * Files are stored at: documents/{authUserId}/{uuid}.pdf
 */
export async function uploadPdf(file: File, authUserId: string): Promise<string> {
  const fileName = `${crypto.randomUUID()}.pdf`;
  const path = `documents/${authUserId}/${fileName}`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (error) throw error;
  return path;
}

/**
 * Get a signed URL for a stored file
 * @param file_path - The storage path of the file
 * @param expiresIn - Expiration time in seconds (default: 600 = 10 minutes)
 */
export async function getSignedUrl(file_path: string, expiresIn = 600): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(file_path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param file_path - The storage path of the file (e.g. documents/<authUserId>/<uuid>.pdf)
 */
export async function deleteFile(file_path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('documents')
    .remove([file_path]);

  if (error) throw error;
}
