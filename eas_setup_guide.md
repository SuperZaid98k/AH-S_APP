# Step-by-Step Guide: EAS Build & OTA Updates with Expo

This guide details how to bundle your React Native Expo app into a distributable format and configure **EAS Update** so you can push bugfixes and feature updates directly to users' phones instantly from your terminal.

---

## 🛠️ Step 1: Install & Set Up EAS CLI

EAS (Expo Application Services) commands run through a global CLI wrapper. Open your system terminal and execute:

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Log in to your Expo account (create one at expo.dev if you don't have one)
eas login
```

---

## 📦 Step 2: Install the Updates Library

For the app to dynamically fetch and apply Over-the-Air (OTA) updates, you must install the `expo-updates` library in your project:

```bash
npx expo install expo-updates
```

---

## ⚙️ Step 3: Initialize & Link Your Expo Project

Run the initialization command from the project root (`d:\ahs-billing`). This links your local repository to your online Expo Dashboard.

```bash
# Initialize project configuration
eas init
```
*When prompted, choose to create a new project or select an existing one. This command will automatically write a unique `projectId` UUID into your [app.json](file:///d:/ahs-billing/app.json) under the `expo` object.*

---

## 📝 Step 4: Configure app.json for OTA Updates

After initialization, open your [app.json](file:///d:/ahs-billing/app.json) and verify or append the `updates` and `runtimeVersion` configurations. It should look like this:

```json
{
  "expo": {
    "name": "AH&S Billing",
    "slug": "ahs-billing",
    "version": "1.0.0",
    "projectId": "[AUTO_GENERATED_PROJECT_ID]", 
    "updates": {
      "url": "https://u.expo.dev/[AUTO_GENERATED_PROJECT_ID]"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    ...
  }
}
```

### 💡 Why this configuration is vital:
- **`updates.url`**: Tells the client binary where to check for update manifests.
- **`runtimeVersion`**: Protects your app from crashing. By setting it to `"appVersion"`, it ensures that OTA JavaScript updates are only loaded on phones running the exact same native binary version (e.g. `1.0.0`). If you make native changes (e.g. installing new native libraries), bump your app version so updates are targeted correctly.

---

## 🚀 Step 5: Generate the Distributable Binary (APK)

Before you can push updates, users must have the initial app build installed on their phones. We have configured the `preview` profile in your [eas.json](file:///d:/ahs-billing/eas.json) to output a standalone `.apk` file:

```bash
# Build a downloadable APK for Android
eas build --platform android --profile preview
```

### 📋 What happens next:
1. EAS will upload your code and build it in the cloud.
2. If this is your first build, EAS will offer to generate Android keystores/credentials for you automatically. Press **Yes**.
3. Once completed, the terminal will print a **download link to your standalone APK**.
4. Send this link/file to users so they can install it on their phones.

---

## ⚡ Step 6: Push Updates Instantly from Your Terminal

Whenever you make changes to your codebase (like changing React components, colors, text, or business logic) and want to push them to users **without having them reinstall the APK**, follow this sequence:

```bash
# 1. Commit and push your code to git
git add .
git commit -m "Update layout or features"
git push

# 2. Publish the update to your release channel
eas update --branch preview --message "Fixed details page mark-paid layout"
```

### 📱 How the update behaves on the phone:
- When a user opens the app, the `expo-updates` client silently checks the EAS server in the background.
- If a new update is found, it downloads it.
- The next time the user closes and re-opens the app, the new update is applied instantly.
- Alternatively, you can configure manual checks in code to reload the app immediately upon download.
