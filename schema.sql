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

-- Profiles: Users can read their own profile (and others basic info)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (true);

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

-- ==========================================
-- MESSAGING SYSTEM (Conversations, Messages, Blocks)
-- ==========================================

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(car_id, buyer_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks table
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages RLS
-- A user can view a message if they are part of the conversation
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- A user can insert a message if they are part of the conversation and NOT BLOCKED
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = (
        SELECT CASE 
          WHEN c.buyer_id = auth.uid() THEN c.seller_id 
          ELSE c.buyer_id 
        END FROM public.conversations c WHERE c.id = conversation_id
      ) AND b.blocked_id = auth.uid())
    )
  );

-- Users can update is_read of messages in their conversations
CREATE POLICY "Users can update messages" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Blocks RLS
CREATE POLICY "Users can view their blocks" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can insert blocks" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete blocks" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Taxonomy RLS
ALTER TABLE public.car_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view taxonomy" ON public.car_taxonomy
  FOR SELECT USING (true);

CREATE POLICY "Users can insert pending taxonomy" ON public.car_taxonomy
  FOR INSERT TO authenticated WITH CHECK (status = 'pending');

CREATE POLICY "Users can update pending taxonomy" ON public.car_taxonomy
  FOR UPDATE TO authenticated USING (status = 'pending');
