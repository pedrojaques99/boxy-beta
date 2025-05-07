-- Enable the pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the search_vector column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resources' 
    AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE resources ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION update_resource_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.software, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.subcategory, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_resource_search_vector_trigger ON resources;

-- Create the trigger
CREATE TRIGGER update_resource_search_vector_trigger
  BEFORE INSERT OR UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_search_vector();

-- Update existing records
UPDATE resources SET search_vector = 
  setweight(to_tsvector('portuguese', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(software, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(category, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(subcategory, '')), 'C');

-- Create an index for the search vector
DROP INDEX IF EXISTS resources_search_vector_idx;
CREATE INDEX resources_search_vector_idx ON resources USING gin(search_vector); 