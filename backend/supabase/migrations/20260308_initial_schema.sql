-- SciFit Tracker Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  height_cm INTEGER,
  weight_kg NUMERIC,
  goal TEXT,
  days_per_week INTEGER,
  experience_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WORKOUTS TABLE
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SETS TABLE
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  rpe NUMERIC,
  notes TEXT
);

-- NUTRITION_LOGS TABLE
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  calories INTEGER NOT NULL,
  protein_g INTEGER NOT NULL
);

-- MEDIA_UPLOADS TABLE
CREATE TABLE media_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lift_video', 'meal_image')),
  storage_path TEXT NOT NULL,
  ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'done', 'error')),
  ai_result JSONB
);

-- RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

-- Profiles - only allow users to see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Workouts - only allow users to see/edit their own workouts
CREATE POLICY "Users can view own workouts" ON workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Sets - only allow users to see/edit sets for their own workouts
CREATE POLICY "Users can view own sets" ON sets 
FOR SELECT 
USING (
  auth.uid() = (SELECT user_id FROM workouts WHERE id = sets.workout_id)
);

CREATE POLICY "Users can insert own sets" ON sets 
FOR INSERT 
WITH CHECK (
  auth.uid() = (SELECT user_id FROM workouts WHERE id = sets.workout_id)
);

CREATE POLICY "Users can update own sets" ON sets 
FOR UPDATE 
USING (
  auth.uid() = (SELECT user_id FROM workouts WHERE id = sets.workout_id)
);

CREATE POLICY "Users can delete own sets" ON sets 
FOR DELETE 
USING (
  auth.uid() = (SELECT user_id FROM workouts WHERE id = sets.workout_id)
);

-- Nutrition Logs: users can only see/edit their own nutrition logs
CREATE POLICY "Users can view own nutrition logs" ON nutrition_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition logs" ON nutrition_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs" ON nutrition_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition logs" ON nutrition_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Media Uploads: users can only see/edit their own uploads
CREATE POLICY "Users can view own media uploads" ON media_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media uploads" ON media_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media uploads" ON media_uploads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media uploads" ON media_uploads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to handle new user signup - automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
