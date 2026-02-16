# Database Schema Updates for Ads & Premium Features

## Run these SQL commands in your Supabase SQL Editor:

### 1. Create `ads` table
```sql
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'banner')),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Allow public read access to ads
CREATE POLICY "Public can view ads" ON ads FOR SELECT USING (true);

-- Only admins can insert/update/delete ads
CREATE POLICY "Admins can manage ads" ON ads FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
);
```

### 2. Update `videos` table to support ads
```sql
-- Add ads columns to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS preroll_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL;

-- Add foreign key comment
COMMENT ON COLUMN videos.preroll_ad_id IS 'References the ad to play before this video';
```

### 3. Create storage buckets for ads
```sql
-- Create ads_videos bucket (for pre-roll video ads)
INSERT INTO storage.buckets (id, name, public) VALUES ('ads_videos', 'ads_videos', true);

-- Create ads_banners bucket (for banner image ads)
INSERT INTO storage.buckets (id, name, public) VALUES ('ads_banners', 'ads_banners', true);
```

### 4. Set storage policies for ads buckets
```sql
-- Allow public to read ad videos
CREATE POLICY "Public can view ad videos" ON storage.objects FOR SELECT USING (bucket_id = 'ads_videos');

-- Only admins can upload ad videos
CREATE POLICY "Admins can upload ad videos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ads_videos' AND auth.jwt() ->> 'role' = 'admin'
);

-- Allow public to read ad banners
CREATE POLICY "Public can view ad banners" ON storage.objects FOR SELECT USING (bucket_id = 'ads_banners');

-- Only admins can upload ad banners
CREATE POLICY "Admins can upload ad banners" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ads_banners' AND auth.jwt() ->> 'role' = 'admin'
);
```

### 5. Verify `profiles` table has `tier` column
```sql
-- Check if tier column exists (should already exist from previous setup)
-- If not, add it:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium'));
```

## Summary of Changes:
1. ✅ Created `ads` table to store ad videos and banners
2. ✅ Added `ads_enabled` and `preroll_ad_id` to `videos` table
3. ✅ Created storage buckets for ads (`ads_videos`, `ads_banners`)
4. ✅ Set up RLS policies for security
5. ✅ Verified `tier` column exists in `profiles` table

## Testing:
1. Upload a test video ad via Admin Dashboard
2. Assign it to a video
3. Watch the video as a free user (should see ad)
4. Subscribe to Premium
5. Watch the same video (should NOT see ad)
