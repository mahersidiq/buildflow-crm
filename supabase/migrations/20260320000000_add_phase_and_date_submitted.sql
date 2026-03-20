-- Add missing columns that the application expects

-- Projects: add 'phase' column for construction phase tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'Pre-Construction';

-- RFIs: add 'date_submitted' column for tracking submission date
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS date_submitted DATE;
