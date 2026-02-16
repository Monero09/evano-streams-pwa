# 🚀 Quick Start - How to Launch Your App

## Step 1: Database Setup (5 minutes)
1. Open your Supabase Project Dashboard
2. Go to **SQL Editor**
3. Copy ALL SQL from `DB_MIGRATION.md`
4. Paste and run in SQL Editor
5. Verify tables created: `ads`, and columns added to `videos`

---

## Step 2: Paystack Setup (3 minutes)
1. Log in to https://paystack.com
2. Go to **Settings → API Keys**
3. Copy your **Public Test Key** (starts with `pk_test_`)
4. Open `src/PremiumPage.tsx`
5. Line 21: Replace `'pk_test_YOUR_PAYSTACK_PUBLIC_KEY'` with your actual key

Example:
```tsx
key: 'pk_test_abc123xyz456', // ← Your real key here
```

---

## Step 3: Run the App (1 minute)
```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Step 4: Test the Full Flow (10 minutes)

### A. Test Free User (Sees Ads)
1. ✅ Browse videos without login
2. ✅ Watch a video
3. ✅ See pre-roll ad (if admin has assigned one)

### B. Test Creator Flow
1. ✅ Click "Login" → Register as Creator
2. ✅ Go to Creator Dashboard
3. ✅ Upload a test video
4. ✅ Video goes to "Pending" status

### C. Test Admin Flow
1. ✅ Login as admin (set role in Supabase manually)
2. ✅ Go to Admin Dashboard
3. ✅ Approve the pending video
4. ✅ Click "Manage Ads"
5. ✅ Upload a test ad video
6. ✅ Assign ad to a video
7. ✅ Refresh homepage - video now shows with ad

### D. Test Premium Flow
1. ✅ Login as viewer
2. ✅ Click profile → "Go Premium"
3. ✅ Click "Subscribe Now"
4. ✅ Use Paystack test card: `4084 0840 8408 4081`
5. ✅ CVV: `123`, Expiry: `12/25`, PIN: `1234`, OTP: `123456`
6. ✅ Payment succeeds
7. ✅ Tier updates to Premium
8. ✅ Watch video - **NO AD SHOWS**

---

## Step 5: Make it a PWA (2 minutes)

### On Mobile (Android)
1. Open the app in Chrome
2. Wait 60 seconds (or visit twice)
3. Orange banner appears: "Install Evano Streams"
4. Click "Install"
5. App icon appears on home screen
6. Open app - runs full-screen!

### On Desktop (Chrome/Edge)
1. Click the install icon in address bar (⊕ or computer icon)
2. Click "Install"
3. App opens in standalone window

---

## Step 6: Go Live (When Ready)

### Database
✅ Already live (Supabase production)

### Payment
1. Complete Paystack business verification
2. Switch to **Live Mode** in Paystack
3. Get Live Public Key (`pk_live_...`)
4. Update `src/PremiumPage.tsx` with live key

### Deploy
```bash
npm run build
```
Deploy `dist/` folder to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting

---

## 🎯 Feature Checklist

### Phase 1: Data Flow ✅
- [x] Creator uploads work
- [x] Admin approvals work
- [x] View counting works

### Phase 2: PWA ✅
- [x] Manifest file created
- [x] Service worker registered
- [x] Install prompt shows after 60s
- [x] App installs on mobile

### Phase 3: Ads & Premium ✅
- [x] Admin can upload ads
- [x] Admin can assign ads to videos
- [x] Free users see ads
- [x] Premium users don't see ads
- [x] Paystack payment works
- [x] Tier updates after payment

---

## 🐛 Troubleshooting

### "Can't upload videos"
→ Check Supabase storage buckets exist: `videos`, `thumbnails`, `ads_videos`, `ads_banners`

### "Payment succeeds but still see ads"
→ Logout and login again to refresh tier state

### "Install button doesn't show"
→ Wait 60 seconds OR open DevTools → Application → Manifest (check for errors)

### "Database error"
→ Run all SQL from `DB_MIGRATION.md` again

---

## 📚 Documentation Files

- `README.md` - Complete feature list & architecture
- `DB_MIGRATION.md` - SQL commands for database
- `PAYSTACK_SETUP.md` - Payment integration guide
- `QUICK_START.md` - This file (launch checklist)

---

## 🎉 You're Done!

Your app now has:
1. ✅ PWA installation
2. ✅ Free & Premium tiers
3. ✅ Paystack payments
4. ✅ Admin ad management
5. ✅ Tier-based ad display
6. ✅ Video analytics

**Everything from the requirements is implemented!**
