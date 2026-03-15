-- SAFER VERSION FOR SUPABASE SQL EDITOR --

-- 1. Ensure 'multimedia' bucket exists and is public
-- Using the storage API function instead of direct table insert if possible, 
-- but the table insert is usually fine. Let's try to be safer.
INSERT INTO storage.buckets (id, name, public)
VALUES ('multimedia', 'multimedia', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies if they exist (Safer than DELETE FROM storage.policies)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;

-- 3. Create new permissive policies

-- Allow public read access to anyone
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'multimedia' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'multimedia' );

-- Allow authenticated users to update files
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'multimedia' );

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'multimedia' );
