# VidyaVerse — Instructions for Your Local AI Assistant (Run Directly in Expo Go)

> **IMPORTANT FOR LOCAL AI:**  
> Do **NOT** rewrite, convert, or modify any files. Do **NOT** launch Safari or a web browser for the mobile app.  
> The native React Native + Expo Go application (**VidyaVerse** — *A Virtual Platform for a Better Future.*) is **already completely built** inside the `expo-app/` folder with **zero login / zero Google sign-in required**.  
> Simply install dependencies inside `expo-app/` and start the Expo Metro bundler for **Expo Go**.

---

## 1. Project Structure Overview

- **Root folder (`/`)**: Web preview version (React + Vite + Three.js) used for browser preview.
- **`expo-app/` folder (`/expo-app`)**: **The complete standalone React Native + Expo SDK 52 + Expo Router + Three.js WebView mobile application** designed to run **natively inside Expo Go** on Android and iOS (not in Safari or Chrome).

---

## 2. Exact Step-by-Step Commands for Your Local AI

Run these exact commands from the project root directory without altering any source code:

```bash
# Step 1: Enter the Expo mobile app directory
cd expo-app

# Step 2: Install exact Expo-compatible packages (includes Syne, Manrope, IBM Plex Mono fonts)
npm install

# (Optional safety check if Expo asks to align native peer versions for your local Expo Go app)
npx expo install --check

# Step 3: Start the Expo Metro development server for Expo Go
npx expo start
```

If your phone and computer are on different Wi-Fi networks or behind a firewall, start with tunnel mode:

```bash
npx expo start --tunnel
```

If Metro has stale cache from another project, clear cache with:

```bash
npx expo start -c
```

---

## 3. How to Open on Your Phone (Without Safari / Browser)

1. Install **Expo Go** from the **Google Play Store** (Android) or **Apple App Store** (iOS).
2. Connect your phone and computer to the **same Wi-Fi network** (or use `--tunnel` above).
3. **Android**: Open the **Expo Go** app and tap **"Scan QR code"** -> scan the QR code shown in the terminal.
4. **iOS**: Open the **Camera** app (or Expo Go) -> scan the QR code -> tap **"Open in Expo Go"**.
   - **NOTE:** Do **not** press `w` in the Expo CLI (that opens a web browser). Always scan the QR code to launch directly inside **Expo Go**.
   - **Zero Login:** VidyaVerse opens immediately into the sequential spectral intro and interactive laboratories with no account or Google login required.

---

## 4. Architecture Inside `expo-app/` (For AI Reference Only — Do Not Edit)

- `expo-app/app/_layout.tsx` — Root Expo Router stack with `Syne`, `Manrope`, and `IBM Plex Mono` font loading, `GestureHandlerRootView`, and Obsidian Black `StatusBar`.
- `expo-app/app/index.tsx` — Sequential Spectral **VIDYAVERSE** Splash Screen (*A Virtual Platform for a Better Future.*) with converging color beams, optical prism mark, and letter-by-letter series reveal.
- `expo-app/app/home.tsx` — Obsidian Black Home Dashboard with photorealistic dark-studio subject hardware cards, Learning Journey, Daily STEM Challenge, Featured 3D Lab, Popular & Recently Viewed.
- `expo-app/app/subject/[id].tsx` — Subject Dashboard with search, category filters, and all 10 experiments per subject.
- `expo-app/app/experiment/[id].tsx` — Experiment Detail screen with embedded live `react-native-webview` 3D preview & audio narration (`expo-speech`).
- `expo-app/app/lab/[id].tsx` — Full-Screen Interactive 3D Laboratory running Three.js inside `react-native-webview` with bidirectional `postMessage` / `onMessage` communication, Exploded View slider, parameter sliders, component inspector, and quiz.
- `expo-app/app/search.tsx` — Global search across all 40 experiments + saved filter.
- `expo-app/app/profile.tsx` — Local student profile, streak, language switcher (English / Hindi / Kannada), Lightweight 3D toggle.
- `expo-app/src/viewer/buildViewerHtml.ts` — Self-contained Three.js HTML5 3D engine featuring realistic machined Physics instruments with live 3D visual outputs (`P01`–`P10` projection screens, lateral shift console, VIBGYOR band spectrum, Snellen eye acuity monitor, DC PSU OLED + V-I oscilloscope, Edison wattmeter, dipole Hall gaussmeter, generator EMF scope, bi-polar Lenz LEDs + pulse scope) alongside anatomical Biology (`B01`, `B04`, `B05`), Chemistry, and Math 3D scenes.

---

## 5. Quick Troubleshooting for Local AI

- **If `npm install` shows peer dependency warnings**: Run `npm install --legacy-peer-deps` or `npx expo install --fix` inside `expo-app/`.
- **If the QR code fails to connect on phone**: Run `npx expo start --tunnel` inside `expo-app/`.
- **If `WebView` 3D canvas needs internet on first load**: The 3D viewer imports `three@0.170.0` inside the WebView via jsDelivr CDN, so ensure the phone has internet access when opening a 3D lab.
