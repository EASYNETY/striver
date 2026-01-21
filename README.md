# STRIVER - Football Social App

Production-ready cross-platform mobile application for football fans, with strict age-based safety features.

## Tech Stack
- **Frontend**: React Native
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Payments**: Stripe
- **Analytics**: GA4

## Features
- **Age Tiers**: 4-12 (Junior Baller), 13-17 (Academy Prospect), 18+ (First Teamer).
- **Family Accounts**: Parent-managed child profiles (up to 5).
- **Main Feed**: Vertical video feed with interactive responses.
- **Rewards**: Earn coins through engagement and unlock tiers (Bronze -> GOAT).
- **Squads**: Join fan communities with premium subscription support.
- **Safety**: Automated moderation, parental consent, and restricted features for minors.

## Project Structure
- `src/api`: Firebase & external API services.
- `src/components`: Reusable UI components.
- `src/constants`: Theme, Age Rules, and Global configs.
- `src/navigation`: React Navigation setup.
- `src/screens`: All applications screens organized by feature.
- `src/utils`: Helpers for analytics, validation, and gestures.

## Setup & Running
1. **Install Dependencies**: `npm install`
2. **Firebase Setup**:
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to `ios/`
3. **Run Android**: `npm run android`
4. **Run iOS**: `npm run ios`

## Safety & Compliance
- **COPPA/GDPR**: Strictly enforced via database rules and age-tier logic.
- **Moderation**: All content for <13 goes through a moderation queue.
- **Parental Control**: Parents approve uploads, payments, and social interactions for children.


"scripts": {
  "build:debug": "cd android && gradlew assembleDebug",
  "build:release": "cd android && gradlew assembleRelease",
  "clean": "cd android && gradlew clean"
}

C:\Program Files\Java\jdk-11.0.16
app id
ba88fb94864b28993bd74fafb509c849
api token
23faa50c6fb8c8dc0ee2a014a8c9c6db275a74c2461ac6f2d5e6ceae7b961d58