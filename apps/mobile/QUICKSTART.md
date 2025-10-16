# 🚀 Quick Start Guide - Numeroly Mobile App

## For Complete Beginners - Get Running in 5 Minutes!

### Step 1: Open Terminal in VSCode

1. Open **Visual Studio Code**
2. Open this folder: `File > Open Folder` → Select `mobile-app`
3. Open Terminal: Press `` Ctrl + ` `` (or `View > Terminal`)

### Step 2: Start the App

In the terminal, type:

```bash
npm start
```

Press Enter. You'll see a QR code!

### Step 3: Test on Your Phone

**Option A: Real Phone (Recommended)**

1. Download **Expo Go** app:
   - iPhone: App Store
   - Android: Google Play

2. **Scan the QR code** from the terminal:
   - iPhone: Use Camera app
   - Android: Use Expo Go app

3. Wait 1-2 minutes → App loads on your phone!

**Option B: Simulator (Advanced)**

- iOS: Press `i` in terminal (Mac only, requires Xcode)
- Android: Press `a` in terminal (requires Android Studio)

---

## ✅ What You'll See

1. **Welcome Screen** - Purple app with lotus emoji 🪷
2. Tap **"Bắt đầu"** (Start)
3. **Phone Auth Screen** - Enter Vietnamese phone (+84...)
4. **Home Screen** - Big purple voice button!

---

## 🎯 Try These Features

### Test the Voice Button

1. Tap the big purple button
2. Watch it animate through states:
   - Idle → Listening → Processing → Speaking → Idle

### Check Your Profile

1. Tap **"Hồ sơ"** tab at bottom
2. See numerology cards with gradient colors
3. Cards animate when they appear!

---

## 🐛 Something Broke?

### App Won't Start

```bash
npm install
npm start
```

### Changes Not Showing

- **Shake your phone** → Tap "Reload"
- Or stop terminal (`Ctrl + C`) → `npm start` again

### Port Already in Use

```bash
npx kill-port 8081
npm start
```

### Clear Cache

```bash
npm run clear-cache
```

---

## 📝 Making Your First Change

### 1. Change Welcome Text

**File:** `src/screens/onboarding/WelcomeScreen.tsx`

Find line ~23:
```tsx
<Text style={styles.tagline}>Khám phá bản thân qua thần số học</Text>
```

Change to:
```tsx
<Text style={styles.tagline}>Your new text here!</Text>
```

**Save** → App reloads automatically!

### 2. Change Button Color

**File:** `src/utils/colors.ts`

Find line ~6:
```typescript
primaryPurple: '#6B4CE6',
```

Change to:
```typescript
primaryPurple: '#FF0000',  // Red button!
```

**Save** → Button turns red!

---

## 📱 Project Structure (Simplified)

```
mobile-app/
├── App.tsx              ← Main app entry
├── src/
│   ├── screens/         ← All your screens
│   │   ├── HomeScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/      ← Reusable parts
│   │   ├── voice/       ← Voice button
│   │   └── cards/       ← Numerology cards
│   └── utils/           ← Colors, constants
└── package.json         ← Dependencies
```

---

## 🎨 Key Files to Explore

| File | What It Does |
|------|--------------|
| `src/screens/HomeScreen.tsx` | Main screen with voice button |
| `src/components/voice/VoiceButton.tsx` | Purple voice button |
| `src/utils/colors.ts` | All colors used in app |
| `src/store/authStore.ts` | User login state |

---

## 💡 Pro Tips

### Hot Reload Not Working?

Shake phone → "Enable Fast Refresh"

### Want to See Errors?

Shake phone → "Show Dev Menu" → "Debug Remote JS"

### Test on Multiple Phones

Same QR code works on all devices at once!

---

## 🆘 Common Questions

**Q: Do I need a backend server?**  
A: Not yet! App uses mock data for now.

**Q: Can I test without a phone?**  
A: Yes! Use iOS Simulator (Mac) or Android Emulator.

**Q: Why does first load take long?**  
A: Expo downloads the app to your phone. Second time is instant!

**Q: How do I add new screens?**  
A: Read the full [README.md](./README.md) for tutorials.

---

## 📚 Next Steps

1. ✅ App running? **You're done!**
2. Read [README.md](./README.md) for detailed tutorials
3. Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture
4. Start building features!

---

## 🎉 You're All Set!

The app is running on your phone. Now you can:
- Make code changes and see them instantly
- Learn React Native by editing components
- Build new features following the guides

**Happy Coding!** 🚀

---

**Need Help?** Check the full [README.md](./README.md) troubleshooting section.
