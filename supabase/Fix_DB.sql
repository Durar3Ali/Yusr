-- =========================================
-- FIX / PATCH SCRIPT
-- Run this in the Supabase SQL Editor to repair the existing database.
-- Safe to run multiple times (idempotent).
-- =========================================

-- Fix 1: Replace the trigger function with the corrected version.
-- The previous version had "back new;" (invalid PL/pgSQL) instead of "return new;",
-- which caused the trigger to fail silently and never create a public.users row
-- when a user signed up. This is the root cause of the Library "Sign in" prompt
-- and the Settings page showing empty name/email.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END $$;

-- Fix 2: Recreate the broken preferences_self_update RLS policy.
-- The previous version had "select in public.users u" (invalid SQL).
DROP POLICY IF EXISTS preferences_self_update ON public.preferences;

CREATE POLICY preferences_self_update
ON public.preferences FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.preferences.user_id
      AND u.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.preferences.user_id
      AND u.auth_user_id = auth.uid()
  )
);

-- Fix 3: Backfill public.users for any existing auth.users that have no matching row.
-- This covers any user who signed up while the trigger was broken.
INSERT INTO public.users (auth_user_id, full_name, email)
SELECT
  id,
  COALESCE(NULLIF(raw_user_meta_data->>'full_name', ''), split_part(email, '@', 1)),
  email
FROM auth.users
ON CONFLICT (auth_user_id) DO NOTHING;

-- Fix 4: Add created_at column to documents if it is missing.
-- The original migration may have been applied from an older version of the schema
-- that did not include this column. The listDocuments query orders by created_at,
-- which causes a PostgreSQL error ("column documents.created_at does not exist")
-- and surfaces in the UI as "Failed to load your library".
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Fix 5: Reset the documents RLS policies to a clean known state.
-- The table shows 2 RLS policies in Supabase, suggesting a stale policy from
-- a previous migration may be present alongside the current one.
DROP POLICY IF EXISTS docs_self_crud ON public.documents;
DROP POLICY IF EXISTS docs_owner ON public.documents;
DROP POLICY IF EXISTS documents_policy ON public.documents;

CREATE POLICY docs_self_crud
ON public.documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.documents.user_id
      AND u.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.documents.user_id
      AND u.auth_user_id = auth.uid()
  )
);

-- Fix 6: Backfill any existing rows where full_name is NULL.
-- Uses the local part of the email (before @) as a safe fallback.
UPDATE public.users
SET full_name = split_part(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- Fix 7: Enforce NOT NULL on full_name now that all rows have a value.
ALTER TABLE public.users
  ALTER COLUMN full_name SET NOT NULL;
