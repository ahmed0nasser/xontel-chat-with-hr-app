# Chat with HR App

## Overview

The "Chat with HR App" is a mobile and web application built with Expo and React Native, designed to facilitate seamless communication between employees and their HR department. The application provides a secure and intuitive platform for employees to chat with HR, view their profile information, and receive timely updates. It leverages Firebase for backend services, including authentication and real-time messaging, ensuring a robust and scalable solution.

## Features

- **User Authentication**: Secure login and logout functionality using Firebase Authentication. User credentials are securely stored for auto-login.
- **Real-time Chat**: Employees can engage in real-time chat conversations with the HR team.
- **HR Contact**: Easily identify and initiate conversations with the designated HR representative.
- **Message Management**: Messages are displayed chronologically, with automatic "read" status updates.
- **Unread Message Count**: Users are notified of unread messages from HR.
- **User Profile**: View and manage personal profile information, including name, title, and join date.
- **Intuitive UI**: A clean and modern user interface built with React Native components and a custom theme.
- **Cross-Platform**: Developed with Expo, allowing deployment to iOS, Android, and Web platforms from a single codebase.
- **Data Seeding**: Includes a script to seed Firebase with initial user and conversation data for quick setup and testing.

## Technologies Used

- **Framework**: Expo, Expo Router
- **Frontend**: React Native, TypeScript
- **Styling**: Custom theme management (`utils/theme.ts`)
- **Backend**: Firebase (Authentication, Firestore for real-time database)
- **State Management**: React Context API (`AuthContext.tsx`)
- **Navigation**: Expo Router, React Navigation
- **UI Icons**: `@expo/vector-icons`, `lucide-react-native`
- **Utilities**: `expo-secure-store` for secure credential storage, custom formatters (`utils/formatters.ts`)

## Project Structure

```
.
├── app/                      # Main application screens and navigation
│   ├── (tabs)/               # Tab-based navigation screens (Chat list, Profile)
│   │   ├── _layout.tsx       # Tab navigator layout
│   │   ├── index.tsx         # Main chat list screen
│   │   └── profile.tsx       # User profile screen
│   ├── _layout.tsx           # Root layout for stack navigation and authentication flow
│   ├── +not-found.tsx        # Not found screen
│   ├── chat.tsx              # Individual chat conversation screen
│   └── login.tsx             # User login screen
├── assets/                   # Static assets like images and icons
├── components/               # Reusable UI components (e.g., DateBadge)
├── config/                   # Configuration files (e.g., Firebase initialization)
├── contexts/                 # React Contexts for global state (e.g., AuthContext)
├── hooks/                    # Custom React hooks (e.g., useFrameworkReady)
├── scripts/                  # Utility scripts (e.g., seedFirebase.ts)
├── services/                 # API service integrations (e.g., Firebase interactions)
├── types/                    # TypeScript type definitions
├── utils/                    # Utility functions and theme definitions
├── .gitignore                # Specifies intentionally untracked files to ignore
├── app.json                  # Expo application configuration
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── ...                       # Other configuration files (eslint, pnpm-lock, etc.)
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Expo CLI (`npm install -g expo-cli` or `pnpm add -g expo-cli`)
- A Firebase project set up with Firestore and Authentication enabled.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/xontel-coding-challenge/chat-app.git
    cd chat-app
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Firebase Configuration:**
    Create a `.env` file in the root of the project and add your Firebase configuration details:

    ```
    EXPO_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    EXPO_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    EXPO_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

4.  **Seed Firebase (Optional but Recommended):**
    To populate your Firebase Firestore with initial HR and employee data, and sample conversations, run the seeding script:
    ```bash
    pnpm ts-node scripts/seedFirebase.ts
    # or
    npm run seed-firebase # (You might need to add this script to package.json)
    ```
    _Note: Ensure `ts-node` is installed globally or locally (`pnpm add -D ts-node` or `npm install -D ts-node`)._

### Running the Application

1.  **Start the Expo development server:**
    ```bash
    pnpm dev
    # or
    npm run dev
    ```
2.  **Open on your device:**
    - Scan the QR code with the Expo Go app (iOS/Android).
    - Run on an iOS simulator or Android emulator.
    - Run in a web browser by pressing `w` in the terminal.

## Usage

### Login

Use the provided demo credentials or the seeded user credentials to log in:

- **Username**: `john.doe`
- **Password**: `password123`

### Chat

After logging in, you will see the main chat screen. Tap on the HR contact to open the chat conversation. You can send messages and see real-time updates.

### Profile

Navigate to the "Profile" tab to view your user details and log out of the application.
