# Ad Management System - Complete Guide

## Overview
Admins have **full manual control** over which ads appear on which videos. No automated ad networks.

---

## 1. Ad System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                          │
│                                                              │
│  ┌────────────────┐         ┌────────────────┐             │
│  │ Upload Ad      │         │ Manage Videos  │             │
│  │                │         │                │             │
│  │ • Video Ads    │────────▶│ • Assign Ad ID │             │
│  │ • Banner Ads   │         │ • Toggle On/Off│             │
│  └────────────────┘         └────────────────┘             │
│         │                            │                      │
│         ▼                            ▼                      │
│  ┌────────────────────────────────────────────┐            │
│  │        Supabase Storage & Database         │            │
│  │                                            │            │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  │            │
│  │  │ads table│  │ videos  │  │ storage  │  │            │
│  │  │         │  │ (ads_   │  │ buckets  │  │            │
│  │  │ •id     │  │ enabled)│  │          │  │            │
│  │  │ •type   │◀─┤ (preroll│  │ •ads_    │  │            │
│  │  │ •url    │  │ _ad_id) │  │ videos   │  │            │
│  │  └─────────┘  └─────────┘  │ •ads_    │  │            │
│  │                             │ banners  │  │            │
│  │                             └──────────┘  │            │
│  └────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                      VIDEO PLAYER                            │
│                                                              │
│  WHEN video loads:                                          │
│  1. Check user.tier (from AuthProvider)                     │
│  2. Check video.ads_enabled (from database)                 │
│  3. IF tier === 'free' AND ads_enabled === true:           │
│     → Fetch ad by video.preroll_ad_id                       │
│     → Show pre-roll ad (skippable after 5s)                │
│  4. ELSE:                                                    │
│     → Skip directly to main video                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Admin Workflow

### Step 1: Upload Ad
1. Go to `/admin/ads`
2. Select ad type:
   - **Video**: Pre-roll before main video
   - **Banner**: Image overlay (not yet implemented in player)
3. Enter ad title (e.g., "Coca-Cola Spring Campaign")
4. Upload file (max size depends on Supabase storage limits)
5. Click "Upload Ad"
6. System generates unique Ad ID (UUID)

### Step 2: Assign Ad to Video
1. Scroll to "Manage Video Ads" section
2. Find the video you want to add ads to
3. Click "Assign Ad"
4. Enter the Ad ID you want to use
5. Ad is now linked to that video

### Step 3: Control Ad Display
- **Enable Ads**: Click "Enable Ads" button
  - `video.ads_enabled = true`
  - Free users will see ads
  
- **Disable Ads**: Click "Disable Ads" button
  - `video.ads_enabled = false`
  - No one sees ads (even free users)

---

## 3. User Experience

### Free User Watching Video

```
1. User clicks video
2. WatchPage loads
3. System checks:
   ✓ user.tier = 'free'
   ✓ video.ads_enabled = true
   ✓ video.preroll_ad_id = 'abc-123'
4. System fetches ad from database
5. Pre-roll ad plays (5 seconds)
6. User can skip after 5s
7. Main video plays
```

### Premium User Watching Same Video

```
1. User clicks same video
2. WatchPage loads
3. System checks:
   ✗ user.tier = 'premium' (NOT 'free')
4. System skips ad fetch
5. Main video plays immediately
6. No ads at all
```

---

## 4. Ad Types & Behavior

### Pre-Roll Video Ads ✅ (Implemented)
- **When**: Before main video plays
- **Duration**: Full ad length
- **Skippable**: After 5 seconds
- **Behavior**: Auto-dismisses when ad ends
- **Location**: Full video player area

### Lower-Third Banners ✅ (Placeholder)
- **When**: During main video playback
- **Duration**: 4 seconds
- **Interval**: Random (8-23 seconds apart)
- **Behavior**: Fades in/out automatically
- **Location**: Bottom of video player
- **Status**: Currently shows demo text, not linked to database

### Mid-Roll Ads ❌ (Not Implemented)
- Would pause main video at specific timestamps
- Requires timestamp tracking
- Can be added in future

### Homepage Banners ❌ (Not Implemented)
- Would show banner images on homepage
- Requires homepage banner component
- Can be added in future

---

## 5. Database Schema

### `ads` table
```sql
id              UUID PRIMARY KEY    -- Unique ad identifier
title           TEXT                -- Ad name (e.g., "Nike Summer Sale")
type            TEXT                -- 'video' or 'banner'
url             TEXT                -- Storage URL of ad file
created_at      TIMESTAMP           -- Upload date
```

### `videos` table (ad columns)
```sql
ads_enabled     BOOLEAN DEFAULT true        -- Master on/off switch
preroll_ad_id   UUID REFERENCES ads(id)     -- Which ad to show
```

---

## 6. Storage Buckets

### `ads_videos`
- Contains pre-roll video ads
- Format: MP4, WebM
- Public read access
- Admin-only write

### `ads_banners`
- Contains banner image ads
- Format: JPG, PNG, WebP
- Public read access
- Admin-only write

---

## 7. Control Logic (Code)

### In `WatchPage.tsx`
```tsx
useEffect(() => {
    if (video) {
        // Load ad if: Free tier + Ads enabled + Ad assigned
        if (tier === 'free' && video.ads_enabled && video.preroll_ad_id) {
            getAdById(video.preroll_ad_id).then(ad => {
                if (ad && ad.type === 'video') {
                    setAdUrl(ad.url); // Ad will play
                }
            });
        }
        // Otherwise, adUrl stays undefined (no ad plays)
    }
}, [video, tier]);
```

### In Video Player
```tsx
<VideoPlayer
    videoSrc={video.video_url}
    poster={video.thumbnail_url}
    preRollSrc={adUrl}  // undefined = no ad, URL = show ad
/>
```

---

## 8. Advanced Use Cases

### Scenario 1: Different Ads per Video
```
Video A → Ad X (Coca-Cola)
Video B → Ad Y (Nike)
Video C → No ad (preroll_ad_id = null)
```

### Scenario 2: Same Ad on Multiple Videos
```
Video A → Ad X
Video B → Ad X
Video C → Ad X
(Just assign the same Ad ID to all)
```

### Scenario 3: Temporarily Disable Ads
```
Video has Ad X assigned
BUT ads_enabled = false
Result: No one sees ads (keeps ad assignment for later)
```

### Scenario 4: Premium-Only Video
```
Set ads_enabled = false for specific "premium content"
Even free users won't see ads on that video
(Use for trailers, highlights, etc.)
```

---

## 9. Monetization Strategy

### Revenue Sources
1. **Ad Revenue**: 
   - Sell pre-roll slots to advertisers
   - Charge per impression or per video
   
2. **Premium Subscriptions**:
   - Monthly: ₦1,500 (current pricing)
   - Annual: ₦15,000 (10% discount)

### Pricing Model
```
Free Tier:
- 100% content access
- Sees 1 pre-roll ad per video
- Lower-third banners every ~15s

Premium Tier: ₦1,500/month
- 100% content access
- Zero ads
- Priority support
```

---

## 10. Future Enhancements

### Easy Additions
1. **Mid-roll ads**: Pause at 50% mark, show ad
2. **Homepage banners**: Rotating banner images
3. **Ad analytics**: Track impressions, skips, completion rate
4. **Ad scheduling**: Auto-rotate ads weekly

### Advanced Features
1. **Targeted ads**: Show different ads based on user location
2. **A/B testing**: Test which ads perform better
3. **Advertiser dashboard**: Let brands upload their own ads
4. **Revenue sharing**: Split ad revenue with creators

---

## 11. Admin Best Practices

### Naming Convention
Use descriptive titles:
- ✅ "Q1_2024_Nike_ProductLaunch"
- ✅ "CocaCola_Summer_15s"
- ❌ "ad1"
- ❌ "test"

### File Management
- Keep ad files under 50MB for fast loading
- Use MP4 (H.264) for video ads
- Recommended resolution: 1080p or 720p
- Recommended duration: 10-30 seconds

### Assignment Strategy
- Assign ads to high-view videos first
- Rotate ads every 1-2 weeks
- Monitor view counts to optimize ad placement

---

## 12. Troubleshooting

### "Ad doesn't play"
**Check:**
1. ✅ User is free tier? (Premium users never see ads)
2. ✅ `video.ads_enabled = true`?
3. ✅ `video.preroll_ad_id` is set?
4. ✅ Ad exists in database with correct ID?
5. ✅ Ad type is 'video'?
6. ✅ Ad URL is accessible?

### "Wrong ad plays"
→ Check `video.preroll_ad_id` matches intended ad

### "All users see ads (even premium)"
→ Check `tier` is being fetched from `useAuth()`

### "No one sees ads (even free users)"
→ Check `video.ads_enabled = true`

---

**This is your complete ad management system. Everything is under your control!**
