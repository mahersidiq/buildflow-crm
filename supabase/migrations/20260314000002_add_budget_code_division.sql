-- Add cost code and division columns to budget_items table
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS division text;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS code     text;
