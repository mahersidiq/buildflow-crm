-- Add file_url column to documents and photos tables
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE photos    ADD COLUMN IF NOT EXISTS file_url text;
