# Numeroly Mobile App - Beginner's Guide

A Vietnamese voice-first numerology mobile application built with React Native and Expo.

## 📱 What is This App?

Numeroly is a mobile app that helps users explore Pythagorean numerology through natural voice conversations in Vietnamese. Users can:
- Have voice conversations with an AI about numerology
- Get personalized numerology profile (Life Path, Destiny, Soul, Personality numbers)
- View their numerology insights
- Track conversation history

## 🎯 Tech Stack

- **React Native** - Cross-platform mobile framework (iOS & Android)
- **Expo** - Development platform for React Native
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management
- **React Navigation** - Screen navigation
- **React Native Reanimated** - Smooth animations

---

## 🚀 Getting Started for Beginners

### Prerequisites

Before you start, you need to install these tools on your computer:

#### 1. **Node.js** (v18 or newer)
- Download from: https://nodejs.org/
- Choose the **LTS** (Long Term Support) version
- Install with default settings

#### 2. **Visual Studio Code (VSCode)**
- Download from: https://code.visualstudio.com/
- Install with default settings

#### 3. **Git** (for version control)
- Download from: https://git-scm.com/
- Install with default settings

#### 4. **Expo Go App** (on your phone)
- iOS: Download from App Store
- Android: Download from Google Play Store
- This app lets you test the mobile app on your real phone!

---

## 📦 Installation Steps

### Step 1: Open VSCode

1. Launch Visual Studio Code
2. Open the integrated terminal:
   - **Windows/Linux**: Press `Ctrl + ` (backtick)
   - **Mac**: Press `Cmd + ` (backtick)
   - Or go to: `View > Terminal`

### Step 2: Navigate to Project Folder

In the terminal, type:

```bash
cd /home/hieutt50/projects/numerologist/mobile-app
```

### Step 3: Install Dependencies

This downloads all the required libraries. Run:

```bash
npm install
```

This will take a few minutes. You'll see a lot of text scrolling - that's normal!

### Step 4: Start the Development Server

Run:

```bash
npm start
```

or

```bash
npx expo start
```

You'll see a QR code appear in the terminal!

---

## 📱 Running on Your Phone

### Option 1: Using Expo Go (Easiest)

1. **On Your Phone:**
   - Open the **Expo Go** app
   
2. **Scan the QR Code:**
   - **iPhone**: Use the Camera app to scan the QR code in the terminal
   - **Android**: Use the Expo Go app to scan the QR code

3. **Wait for App to Load:**
   - The app will download to your phone
   - First load takes longer (1-2 minutes)

4. **Test the App:**
   - You should see the Welcome screen!

### Option 2: Using iOS Simulator (Mac Only)

In the terminal, press `i` to open iOS Simulator.

### Option 3: Using Android Emulator

1. **Install Android Studio** first
2. Set up an Android Virtual Device (AVD)
3. In the terminal, press `a` to open Android Emulator

---

## 🎨 Project Structure

```
mobile-app/
├── App.tsx                    # Main app entry point
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── voice/            # Voice button, waveform visualizer
│   │   ├── conversation/     # Chat bubbles, message list
│   │   └── cards/            # Numerology cards
│   ├── screens/              # App screens
│   │   ├── HomeScreen.tsx    # Main conversation screen
│   │   ├── ProfileScreen.tsx # User numerology profile
│   │   └── onboarding/       # Welcome & auth screens
│   ├── navigation/           # Screen navigation setup
│   ├── store/                # State management (Zustand)
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions, constants
├── package.json              # Dependencies list
└── README.md                 # This file!
```

---

## 🛠️ Development Workflow

### Making Changes

1. **Edit a File:**
   - Open any `.tsx` file in VSCode
   - Make your changes
   - Save the file (`Ctrl + S` or `Cmd + S`)

2. **See Changes Instantly:**
   - The app will automatically reload on your phone!
   - This is called "Hot Reloading" - super useful!

3. **If Something Breaks:**
   - Shake your phone to open the developer menu
   - Tap "Reload" to restart the app

### Common Commands

```bash
# Start development server
npm start

# Clear cache and restart (if things get weird)
npm start -- --clear

# Run type checking
npm run tsc

# Install a new package
npm install <package-name>
```

---

## 🐛 Troubleshooting

### Problem: "Command not found: npm"

**Solution:** Node.js is not installed. Go back to Prerequisites and install Node.js.

### Problem: "Port 8081 already in use"

**Solution:** Another app is using that port. Run:
```bash
npx kill-port 8081
npm start
```

### Problem: "Unable to resolve module"

**Solution:** Dependencies might be corrupted. Run:
```bash
rm -rf node_modules
npm install
```

### Problem: App crashes on phone

**Solution:** 
1. Shake your phone > Reload
2. Or restart the development server:
   - Stop the terminal (`Ctrl + C`)
   - Run `npm start` again

### Problem: Changes not appearing on phone

**Solution:**
1. Shake phone > Disable Fast Refresh > Re-enable it
2. Or force reload: Shake phone > Reload

---

## 📚 Useful VSCode Extensions

Install these to make development easier:

1. **ES7+ React/Redux/React-Native snippets**
   - Quick code snippets for React Native

2. **Prettier - Code formatter**
   - Auto-format your code

3. **ESLint**
   - Catch errors before running

4. **React Native Tools**
   - Debugging and IntelliSense

**To Install Extensions:**
1. Click the Extensions icon in VSCode (left sidebar)
2. Search for the extension name
3. Click "Install"

---

## 🎓 Learning Resources

### React Native Basics
- Official Docs: https://reactnative.dev/docs/getting-started
- Expo Docs: https://docs.expo.dev/

### TypeScript
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

### Navigation
- React Navigation: https://reactnavigation.org/docs/getting-started

### State Management
- Zustand: https://github.com/pmndrs/zustand

---

## 🔑 Key Concepts for Beginners

### What is a Component?

A component is a reusable piece of UI. Example:

```tsx
// A simple component
const MyButton = () => {
  return (
    <Pressable onPress={() => alert('Hello!')}>
      <Text>Click Me</Text>
    </Pressable>
  );
};
```

### What is State?

State is data that can change. When state changes, the UI updates automatically:

```tsx
const [count, setCount] = useState(0); // State variable

<Text>{count}</Text>  // Shows current count
<Button onPress={() => setCount(count + 1)} />  // Increases count
```

### What is TypeScript?

TypeScript adds "types" to JavaScript to prevent errors:

```tsx
// Without types (JavaScript)
const add = (a, b) => a + b;

// With types (TypeScript)
const add = (a: number, b: number): number => a + b;
```

---

## 🚀 Next Steps

1. **Explore the Code:**
   - Start with `App.tsx`
   - Look at `src/screens/HomeScreen.tsx`
   - Check out components in `src/components/`

2. **Make a Small Change:**
   - Try changing a color in `src/utils/colors.ts`
   - Modify welcome text in `WelcomeScreen.tsx`
   - See the changes appear on your phone!

3. **Add a Feature:**
   - Add a new button to the Home screen
   - Create a new screen
   - Style components with different colors

4. **Connect to Backend:**
   - Currently using mock data
   - Later: Connect to FastAPI backend
   - Integrate Azure Speech Services for real voice

---

## 📞 Need Help?

- Check the troubleshooting section above
- Read Expo documentation: https://docs.expo.dev/
- Search Stack Overflow for specific errors
- Ask in React Native community forums

---

## 📝 Development Notes

### Current Status (MVP)

✅ Project structure set up
✅ Navigation configured (Welcome → Auth → Home)
✅ Voice Button component with animations
✅ Conversation transcript UI
✅ Numerology cards with gradients
✅ State management with Zustand
✅ TypeScript types defined

🚧 To Do:
- [ ] Integrate Azure Speech Services for STT/TTS
- [ ] Connect to FastAPI backend
- [ ] Implement real voice recording
- [ ] Add Azure AD B2C authentication
- [ ] Add journal feature
- [ ] Add numerology calculation logic

### Mock Data

Currently, the app uses mock/fake data for:
- User authentication (bypasses Azure AD B2C)
- Conversations (no real API calls)
- Numerology numbers (hardcoded values)

This allows you to develop and test the UI without needing a backend server.

---

## 🎉 You're Ready!

You now have a working React Native development environment. Start exploring the code, make changes, and see them live on your phone. Happy coding! 🚀

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Framework:** React Native 0.73+ with Expo 50+
