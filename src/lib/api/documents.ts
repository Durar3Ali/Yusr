import { supabase } from '@/lib/supabaseClient';

export interface Document {
  id: number;
  user_id: number;
  title: string;
  file_path: string | null;
  created_at: string;
}

export interface CreateDocumentPayload {
  user_id: number;
  title: string;
  file_path?: string | null;
}

/**
 * List all documents for a specific user
 */
export async function listDocuments(userId: number): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

/**
 * Create a new document
 */
export async function createDocument(input: CreateDocumentPayload): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id: number): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
