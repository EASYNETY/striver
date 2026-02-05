# Requirements Document

## Introduction

This document specifies the requirements for implementing comprehensive UI/UX improvements across the Striver mobile application based on detailed user feedback. The improvements focus on enhancing branding consistency, typography, user onboarding experience, and overall interface usability across all major screens and flows.

## Glossary

- **App**: The Striver mobile application (React Native, Android-focused)
- **Font_System**: The typography configuration managing display and body text fonts
- **Theme_Config**: The centralized theme configuration file (src/constants/theme.ts)
- **Splash_Screen**: The initial screen displayed when the app launches
- **Onboarding_Flow**: The sequence of screens guiding new users through account setup
- **Account_Type**: Either Individual or Family account classification
- **Premium_Squad**: A paid feature providing enhanced squad functionality
- **Settings_Screen**: The screen where users configure app preferences
- **Rewards_Screen**: The screen displaying user tier progression and benefits
- **Profile_Screen**: The screen showing user information and actions
- **Family_Controls**: Parent dashboard for managing child accounts and approvals

## Requirements

### Requirement 1: Font System Implementation

**User Story:** As a developer, I want to replace the current Outfit font family with Oswald and Noto Sans, so that the app has improved typography that matches the design vision.

#### Acceptance Criteria

1. THE Font_System SHALL use Oswald font for all display text, headings, and prominent UI elements
2. THE Font_System SHALL use Noto Sans font for all body text, descriptions, and general content
3. WHEN font files are added to assets/fonts/, THE App SHALL include both Oswald and Noto Sans .ttf files in multiple weights (Regular, Medium, SemiBold, Bold)
4. WHEN Theme_Config is updated, THE Font_System SHALL define separate font families for display (Oswald) and body (Noto Sans) text
5. THE App SHALL rebuild successfully after font changes with proper asset linking
6. WHERE the Striver brand logo or wordmark exists as a separate asset, THE App SHALL preserve the original brand font for logo/wordmark display
7. THE Font_System SHALL apply Oswald and Noto Sans only to UI text elements, not to brand logo assets

### Requirement 2: Splash Screen Enhancement

**User Story:** As a user, I want to see an enhanced splash screen with clear branding, so that I understand the app's mission from the first moment.

#### Acceptance Criteria

1. WHEN the Splash_Screen displays, THE App SHALL show the tagline "Empowering the next generation"
2. THE Splash_Screen SHALL use Oswald font for the tagline to establish visual hierarchy
3. THE Splash_Screen SHALL maintain smooth transition timing to the welcome screen
4. THE Splash_Screen SHALL display branding elements with improved visual prominence

### Requirement 3: Sign-up Flow Simplification

**User Story:** As a new user, I want a simplified sign-up process with clear messaging, so that I can quickly understand and complete registration.

#### Acceptance Criteria

1. THE Onboarding_Flow SHALL use simplified copy throughout all sign-up screens
2. THE Onboarding_Flow SHALL remove the "Football for a new era" tagline from sign-up screens
3. WHEN users navigate through sign-up, THE App SHALL present streamlined instructions using Noto Sans font
4. THE Onboarding_Flow SHALL maintain clear visual hierarchy using Oswald for headings and Noto Sans for body text

### Requirement 4: Account Type Selection Enhancement

**User Story:** As a new user, I want clear descriptions of Individual vs Family accounts, so that I can make an informed choice about which account type suits my needs.

#### Acceptance Criteria

1. WHEN the account type selection screen displays, THE App SHALL show enhanced descriptions for Individual accounts
2. WHEN the account type selection screen displays, THE App SHALL show enhanced descriptions for Family accounts
3. THE App SHALL present clear value propositions for each Account_Type using Noto Sans font
4. THE App SHALL use Oswald font for account type titles to improve visual hierarchy

### Requirement 5: Onboarding Personalization Improvement

**User Story:** As a new user, I want an engaging personalization flow, so that the app feels tailored to my interests from the start.

#### Acceptance Criteria

1. THE Onboarding_Flow SHALL display improved copy for the interests selection screen
2. THE Onboarding_Flow SHALL use Noto Sans font for interest descriptions to improve readability
3. THE Onboarding_Flow SHALL use Oswald font for section headings to maintain visual hierarchy
4. WHEN users select interests, THE App SHALL provide clear feedback using consistent typography

### Requirement 6: Squads Screen Enhancement

**User Story:** As a user, I want to understand premium squad benefits clearly, so that I can decide whether to upgrade.

#### Acceptance Criteria

1. WHEN the Squads_Screen displays premium features, THE App SHALL show improved messaging about Premium_Squad benefits
2. THE Squads_Screen SHALL use Oswald font for premium feature titles
3. THE Squads_Screen SHALL use Noto Sans font for benefit descriptions
4. THE Squads_Screen SHALL display clear call-to-action buttons for premium features with consistent typography

### Requirement 7: Settings Screen Expansion

**User Story:** As a user, I want comprehensive settings options, so that I can control my app experience and preferences.

#### Acceptance Criteria

1. THE Settings_Screen SHALL include notification settings options
2. THE Settings_Screen SHALL include privacy settings options
3. THE Settings_Screen SHALL include a support/help section
4. THE Settings_Screen SHALL organize settings into clear categories using Oswald font for category headers
5. THE Settings_Screen SHALL use Noto Sans font for setting descriptions and labels

### Requirement 8: Rewards Screen Improvement

**User Story:** As a user, I want to see my tier progression clearly, so that I understand my current status and what I need to achieve next.

#### Acceptance Criteria

1. WHEN the Rewards_Screen displays, THE App SHALL show improved tier visuals with better graphics
2. THE Rewards_Screen SHALL display enhanced progress indicators showing advancement toward next tier
3. THE Rewards_Screen SHALL use Oswald font for tier names and levels
4. THE Rewards_Screen SHALL use Noto Sans font for tier benefit descriptions
5. THE Rewards_Screen SHALL clearly communicate tier requirements using consistent typography

### Requirement 9: Profile Screen Enhancement

**User Story:** As a user, I want easy access to support and reporting options from my profile, so that I can get help or report issues when needed.

#### Acceptance Criteria

1. THE Profile_Screen SHALL include support/help options
2. THE Profile_Screen SHALL include report options
3. THE Profile_Screen SHALL improve layout and information hierarchy using Oswald for headings
4. THE Profile_Screen SHALL use Noto Sans font for user information and descriptions
5. THE Profile_Screen SHALL position action buttons clearly with consistent typography

### Requirement 10: Family Controls Enhancement

**User Story:** As a parent, I want an intuitive family dashboard, so that I can easily manage my children's accounts and approve their activities.

#### Acceptance Criteria

1. WHEN Family_Controls displays the parent dashboard, THE App SHALL show improved design with clear sections
2. THE Family_Controls SHALL display an enhanced approval queue interface using Oswald for headers
3. THE Family_Controls SHALL use Noto Sans font for approval details and child information
4. THE Family_Controls SHALL provide clear child profile management options with consistent typography
5. THE Family_Controls SHALL maintain visual hierarchy throughout all family management screens
