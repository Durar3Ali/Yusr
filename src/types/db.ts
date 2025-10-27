export type UserRow = { 
  id: number; 
  auth_user_id: string; 
  full_name: string | null; 
  email: string; 
};

export type DocumentRow = { 
  id: number; 
  user_id: number; 
  title: string; 
  file_path: string | null; 
};

export * from '@/lib/api/preferences'; // re-export Preferences

