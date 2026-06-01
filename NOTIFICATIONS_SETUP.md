# Notifications Debugging & Setup Guide

## Issues Fixed

### 1. ✅ Missing EAS Project ID (CRITICAL)
**Status**: Partially fixed - requires action

The app was missing the EAS `projectId` which is **required** for push notifications on physical devices.

**What was done**:
- Added `extra.eas.projectId` field to `app.json`
- You need to replace `YOUR_EAS_PROJECT_ID_HERE` with your actual EAS project ID

**How to get your EAS Project ID**:

Option A - If you already have an EAS project:
```bash
# Check your EAS account at https://expo.dev/accounts/[your-username]
# Or run:
eas project:info
```

Option B - If you need to set up EAS for the first time:
```bash
# Initialize EAS (you'll be prompted with your project ID)
eas init

# This will automatically add the projectId to app.json
```

**Update app.json**:
```json
{
  "expo": {
    ...
    "extra": {
      "eas": {
        "projectId": "YOUR_ACTUAL_PROJECT_ID"  // <- Replace this
      }
    }
  }
}
```

### 2. ✅ Improved Error Handling & Logging
**Status**: Completed

Enhanced `notificationService.ts` with comprehensive logging:
- Logs at every step of token registration
- Distinguishes between in-app and push notifications
- Better error tracking with Firebase writes
- Clear warnings when critical configuration is missing

**Debug logs are prefixed with `[Notifications]` for easy filtering**

### 3. ✅ Improved App Startup Handling
**Status**: Completed

Updated `app/_layout.tsx` to:
- Safely configure notifications on app startup
- Log all notification responses
- Better error handling for navigation

---

## How to Verify Notifications Are Working

### Step 1: Check Push Token Registration
1. Build/run the app on your physical device
2. Open the console logs (via Expo app or `expo start --localhost`)
3. Look for these log messages:
   ```
   [Notifications] Starting push token registration for uid: [user-id]
   [Notifications] Physical device detected - requesting permissions
   [Notifications] Current permission status: granted
   [Notifications] Expo project ID: configured  // <- Should show "configured" not "MISSING"
   [Notifications] Successfully obtained push token: ExponentPushToken[...]
   [Notifications] ✓ Push token registered successfully
   ```

### Step 2: Check Permissions
If you see `pushPermissionStatus: denied`:
1. Go to **Settings → Apps → M-Place → Permissions → Notifications**
2. Enable notifications
3. Restart the app and re-run Step 1

### Step 3: Send a Test Notification
Use your backend/Firebase Cloud Function to call:
```javascript
await notifyNewMessage({
  recipientUid: "test-user-id",
  senderName: "Test Sender",
  messageText: "Test message",
  conversationId: "test-conv-id",
  listingId: "test-listing-id",
  listingTitle: "Test Listing",
  listingImage: "image-url",
  listingPrice: "999",
  otherUid: "other-user-id",
});
```

### Step 4: Monitor Notification Delivery
Check logs for:
```
[Notifications] Triggering new_message notification for [recipient-id]
[Notifications] ✓ In-app notification saved
[Notifications] ✓ Push notification sent successfully
```

---

## Common Issues & Solutions

### Issue: "Expo projectId is MISSING"
**Solution**: Update `app.json` with your EAS project ID (see Step 1 above)

### Issue: "No push token found for recipient"
**Solution**: 
- The recipient user hasn't opened the app yet to register their token
- OR their permissions are denied
- OR their push token was revoked (token expires or device was unlinked)

### Issue: Notifications don't appear but logs show "successfully sent"
**Possible causes**:
1. **App is in foreground**: By default, Expo doesn't show a banner for foreground notifications. Check the notification handler in `app/_layout.tsx` - it's configured to show banners (`shouldShowBanner: true`)
2. **Android notification channel not configured**: The app should automatically create the "default" channel on first run
3. **Device notifications are muted globally**: Check device Settings → Sound

### Issue: In-app notifications not appearing on the Bell screen
**Solution**: Check Firebase collection path:
```
notifications / {userId} / items / {notificationId}
```
Make sure your Firebase Security Rules allow writes to this collection.

---

## Firebase Security Rules Recommendation

Add these rules to allow notification storage:

```javascript
match /notifications/{userId}/items/{itemId} {
  allow write: if request.auth.uid == userId;
  allow read: if request.auth.uid == userId;
}
```

---

## Next Steps

1. **CRITICAL**: Get your EAS Project ID and update `app.json`
2. Build and run on a physical device
3. Check the console logs with the `[Notifications]` prefix
4. Enable notifications in device settings if prompted
5. Test by sending a notification through your backend

---

## Files Modified

- `app.json` - Added `extra.eas.projectId` field
- `services/notificationService.ts` - Enhanced logging and error handling
- `app/_layout.tsx` - Improved notification setup and logging

## Debugging Tips

To get detailed logs while testing:
```bash
# Run with verbose logging
expo start --verbose

# Or connect to your running app
expo logs
```

Then filter for `[Notifications]` or `[App]` prefixes.
