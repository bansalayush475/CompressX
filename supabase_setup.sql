-- ========================================================
-- CompressX Supabase Setup Script
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pftaapxjnmetzgqyxvwb/sql
-- ========================================================

-- 1. Create History Table
CREATE TABLE IF NOT EXISTS public.history (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT 'guest',
  filename TEXT NOT NULL,
  original_size BIGINT NOT NULL,
  compressed_size BIGINT NOT NULL,
  space_saved BIGINT NOT NULL,
  space_saved_percentage NUMERIC,
  algorithm TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) & Grant Access Policies
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated users to read and insert history
DROP POLICY IF EXISTS "Public Read History" ON public.history;
CREATE POLICY "Public Read History" ON public.history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert History" ON public.history;
CREATE POLICY "Public Insert History" ON public.history
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Delete History" ON public.history;
CREATE POLICY "Public Delete History" ON public.history
  FOR DELETE USING (true);

-- 3. Create Public Storage Bucket for Compressed Files
INSERT INTO storage.buckets (id, name, public)
VALUES ('compressed-files', 'compressed-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage Access Policies
DROP POLICY IF EXISTS "Public Bucket Access" ON storage.objects;
CREATE POLICY "Public Bucket Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'compressed-files');

DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
CREATE POLICY "Public Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'compressed-files');

DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
CREATE POLICY "Public Delete Access" ON storage.objects
  FOR DELETE USING (bucket_id = 'compressed-files');

-- Done! Tables and storage bucket are now ready for CompressX.
