-- Create business_settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_business_url TEXT,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for business_settings
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and write their own settings
CREATE POLICY "Users can manage their own business settings" ON business_settings
  FOR ALL USING (auth.role() = 'authenticated');



-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_business_settings_updated_at 
  BEFORE UPDATE ON business_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
