-- RUN THIS IN THE SUPABASE SQL EDITOR --

-- 1. Ensure 'multimedia' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('multimedia', 'multimedia', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects (just in case it wasn't)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remove existing policies for the 'multimedia' bucket to clear restrictions
DELETE FROM storage.policies WHERE bucket_id = 'multimedia';

-- 4. Create new permissive policies

-- Allow public read access to anyone
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'multimedia' );

-- Allow authenticated users (Employees/Managers) to upload files
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'multimedia' );

-- Allow authenticated users to update their own/all files in this bucket
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'multimedia' );

-- Allow authenticated users to delete files in this bucket
CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'multimedia' );
