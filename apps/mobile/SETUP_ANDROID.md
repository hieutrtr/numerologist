# Android Development Setup Guide

## ⚡ **Quick Solution: Use Expo Go (No Android SDK Needed)**

### This is the EASIEST way to test your app!

1. **On Your Phone:**
   - Download **Expo Go** app from Google Play Store
   - Open the app

2. **In VSCode Terminal:**
   ```bash
   cd /home/hieutt50/projects/numerologist/mobile-app
   npm start
   ```

3. **Connect:**
   - A QR code will appear in the terminal
   - In Expo Go app, tap "Scan QR Code"
   - Point your phone camera at the QR code
   - App loads on your phone! (Takes 1-2 minutes first time)

**That's it! No Android SDK needed!** ✅

---

## 🛠️ **Full Solution: Install Android Studio (For Emulator)**

### Only do this if you want to use Android Emulator instead of a real phone

### Step 1: Install Android Studio

1. **Download Android Studio:**
   - Go to: https://developer.android.com/studio
   - Download for Linux

2. **Extract and Install:**
   ```bash
   cd ~/Downloads
   tar -xvzf android-studio-*.tar.gz
   sudo mv android-studio /opt/
   cd /opt/android-studio/bin
   ./studio.sh
   ```

3. **Follow Setup Wizard:**
   - Choose "Standard" installation
   - Let it download Android SDK (takes 10-20 minutes)
   - Note the SDK location (usually `/home/hieutt50/Android/Sdk`)

### Step 2: Set Environment Variables

1. **Edit your bash profile:**
   ```bash
   nano ~/.bashrc
   ```

2. **Add these lines at the end:**
   ```bash
   # Android SDK
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

3. **Save and reload:**
   - Press `Ctrl + X` → `Y` → `Enter`
   ```bash
   source ~/.bashrc
   ```

### Step 3: Verify Installation

```bash
# Check if adb is working
adb version

# Should show something like:
# Android Debug Bridge version 1.0.41
```

### Step 4: Create Virtual Device (AVD)

1. **Open Android Studio**
2. Click **"More Actions"** → **"Virtual Device Manager"**
3. Click **"Create Device"**
4. Choose **"Pixel 5"** → **Next**
5. Download **"Tiramisu"** (API 33) system image
6. **Finish** → **Start the emulator**

### Step 5: Run Your App

```bash
cd /home/hieutt50/projects/numerologist/mobile-app
npm run android
```

---

## 🐛 **Common Issues**

### Issue: "adb: command not found"

**Solution:**
```bash
# Reload environment
source ~/.bashrc

# Or restart VSCode terminal
# Close terminal and open new one
```

### Issue: "SDK location not found"

**Solution:**
```bash
# Check where SDK is installed
ls ~/Android/Sdk

# If not there, install Android Studio first
```

### Issue: "No devices found"

**Solution:**
```bash
# Start emulator from Android Studio
# Or connect real phone with USB debugging enabled
adb devices
```

### Issue: Emulator too slow

**Solution:**
- Use Expo Go on real phone instead (much faster!)
- Or use a less powerful emulator (Pixel 4 instead of Pixel 5)

---

## 📱 **Recommended Approach**

### For Beginners: **Expo Go on Real Phone** ⭐

**Pros:**
- ✅ No Android SDK installation needed
- ✅ Faster testing
- ✅ Real device performance
- ✅ Works immediately
- ✅ Can test on multiple phones

**Cons:**
- ❌ Need physical phone

### For Advanced: **Android Emulator**

**Pros:**
- ✅ No phone needed
- ✅ Can test different device sizes
- ✅ Easier for debugging

**Cons:**
- ❌ Requires ~30GB disk space
- ❌ Slow on some computers
- ❌ Long setup time
- ❌ Uses lots of RAM

---

## 🚀 **Quick Commands**

### With Expo Go (Real Phone)
```bash
cd mobile-app
npm start
# Scan QR code with Expo Go app
```

### With Android Emulator
```bash
# Start emulator first from Android Studio
cd mobile-app
npm run android
```

### Check Android Setup
```bash
# Verify SDK location
echo $ANDROID_HOME

# Verify adb
adb version

# List connected devices
adb devices
```

---

## 💡 **Pro Tips**

### For WSL2 Users (Windows Subsystem for Linux)

Android emulator in WSL2 can be tricky. **Recommended:**

1. **Use Expo Go on real phone** (easiest)
2. **Or install Android Studio on Windows** (not in WSL2)
3. Then connect to WSL2 development server

### Enable USB Debugging on Phone

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times (Developer mode enabled)
3. Go to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect phone to computer
6. Allow debugging prompt

---

## ✅ **Verification Checklist**

### If using Expo Go:
- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same WiFi
- [ ] `npm start` shows QR code
- [ ] Can scan QR code and app loads

### If using Android Emulator:
- [ ] Android Studio installed
- [ ] ANDROID_HOME set correctly
- [ ] `adb version` works
- [ ] Emulator can be started
- [ ] `npm run android` launches app

---

## 🆘 **Still Having Issues?**

1. **Try Expo Go first** - It's much simpler!
2. Check official docs: https://docs.expo.dev/get-started/installation/
3. For Android Studio: https://developer.android.com/studio/install

---

**Recommended: Use Expo Go on your phone - it's faster and easier!** 📱✨
