-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT NOT NULL,
  tax_no TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cars table
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  km INTEGER NOT NULL,
  damage_report TEXT,
  price_b2b NUMERIC NOT NULL,
  images TEXT[] DEFAULT '{}',
  location_city TEXT,
  location_district TEXT,
  title TEXT,
  expertise JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User management (Handle new auth user creation -> create profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, tax_no, phone, city, district, trial_ends_at)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'tax_no',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district',
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Cars: Any authenticated user can view active cars IF they are approved and their trial is not expired
CREATE POLICY "Approved users can view active cars" ON public.cars
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.status = 'approved'
      AND profiles.subscription_status != 'expired'
      AND profiles.trial_ends_at > NOW()
    ) AND is_active = TRUE
  );

CREATE POLICY "Users can insert their own cars" ON public.cars FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update their own cars" ON public.cars FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete their own cars" ON public.cars FOR DELETE USING (auth.uid() = seller_id);
