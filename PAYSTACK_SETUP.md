# Paystack Integration Setup Guide

## Prerequisites
1. A Paystack account (sign up at https://paystack.com)
2. Verified business details on Paystack

## Setup Steps

### 1. Get Your Paystack Public Key
1. Log in to your Paystack Dashboard
2. Go to **Settings → API Keys & Webhooks**
3. Copy your **Public Key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)

### 2. Update the App with Your Public Key
Open `/src/PremiumPage.tsx` and replace the placeholder key:

```tsx
// Line 21-22
const handler = window.PaystackPop.setup({
    key: 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY', // ← Replace with your actual key
    email: user.email!,
    amount: 150000, // Amount in kobo (NGN 1,500)
    // ...
});
```

Replace `'pk_test_YOUR_PAYSTACK_PUBLIC_KEY'` with your actual Paystack Public Key.

### 3. Set Your Pricing
The current price is set to **NGN 1,500** (150000 kobo).

To change the price, update the `amount` field:
```tsx
amount: 150000, // NGN 1,500
// Examples:
// amount: 100000, // NGN 1,000
// amount: 200000, // NGN 2,000
// amount: 500000, // NGN 5,000
```

**Note**: Paystack uses kobo (smallest unit), so:
- 1 NGN = 100 kobo
- NGN 1,500 = 150,000 kobo

### 4. Test the Payment Flow
1. Use Paystack's test cards:
   - **Success**: `4084 0840 8408 4081` (Visa)
   - **Declined**: `5060 6666 6666 6666` (Mastercard)
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **PIN**: `1234`
   - **OTP**: `123456`

2. Full test flow:
   ```
   1. User clicks "Go Premium" from profile menu
   2. Clicks "Subscribe Now" on Premium page
   3. Paystack popup appears
   4. User enters test card details
   5. Payment succeeds
   6. User tier updates to 'premium'
   7. Ads disappear
   ```

### 5. Go Live
When ready for production:
1. Complete your Paystack business verification
2. Switch from Test Mode to Live Mode in Paystack Dashboard
3. Get your **Live Public Key** (`pk_live_...`)
4. Update `PremiumPage.tsx` with the live key
5. Deploy your app

## Payment Flow

```
┌─────────────┐
│ Free User   │
│ (sees ads)  │
└──────┬──────┘
       │
       │ Clicks "Go Premium"
       │
       ▼
┌──────────────────┐
│  Premium Page    │
│  (Shows benefits)│
└────────┬─────────┘
         │
         │ Clicks "Subscribe"
         │
         ▼
┌──────────────────┐
│ Paystack Popup   │
│ (Card Details)   │
└────────┬─────────┘
         │
         │ Payment Success
         │
         ▼
┌──────────────────┐
│ Update DB        │
│ tier = 'premium' │
└────────┬─────────┘
         │
         │ Page Reload
         │
         ▼
┌──────────────────┐
│ Premium User     │
│ (no ads shown)   │
└──────────────────┘
```

## Important Notes

### Security
- Public keys are safe to expose in frontend code
- Never expose your Secret Key (`sk_test_...` or `sk_live_...`)
- The current implementation uses client-side verification only

### Recommended Production Enhancement
For production, you should add **server-side verification**:

1. After payment, user gets a `reference` from Paystack
2. Send this reference to your backend
3. Backend calls Paystack API to verify the transaction
4. Only then update the user's tier

This prevents users from manually calling the `updateUserTier` function to cheat the system.

### Subscription Management
The current implementation is a **one-time payment** model. For recurring subscriptions:
1. Use Paystack's Subscription API
2. Set up webhooks to handle subscription events
3. Create a backend endpoint to process webhooks

## Troubleshooting

### "PaystackPop is not defined"
- Ensure the Paystack script is loaded in `index.html`
- Check browser console for script loading errors

### Payment succeeds but tier doesn't update
- Check browser console for errors
- Verify the user is logged in
- Check Supabase logs for database errors
- Ensure RLS policies allow the update

### Test payment fails
- Use exact test card numbers from Paystack docs
- Ensure you're in Test Mode
- Check Paystack Dashboard for transaction logs

## Support
- Paystack Docs: https://paystack.com/docs
- Paystack Support: support@paystack.com
