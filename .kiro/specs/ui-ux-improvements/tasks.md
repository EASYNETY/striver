# Implementation Plan: UI/UX Improvements

## Overview

This implementation plan breaks down the UI/UX improvements into discrete, incremental tasks. The approach follows a phased strategy: first updating the font system foundation, then enhancing onboarding screens, and finally improving main app screens. Each task builds on previous work and includes testing to validate changes.

## Tasks

- [x] 1. Download and integrate font files
  - Download Oswald font family (.ttf files: Regular, Medium, SemiBold, Bold)
  - Download Noto Sans font family (.ttf files: Regular, Medium, SemiBold, Bold, Light)
  - Place all font files in `assets/fonts/` directory
  - Verify font file naming follows React Native conventions (e.g., `Oswald-Bold.ttf`)
  - _Requirements: 1.3_

- [ ] 2. Update theme configuration for dual font system
  - [x] 2.1 Modify `src/constants/theme.ts` to support display and body fonts
    - Replace single FONTS object with nested structure (display and body)
    - Define Oswald fonts under `FONTS.display` (bold, semiBold, medium, regular)
    - Define Noto Sans fonts under `FONTS.body` (bold, semiBold, medium, regular, light)
    - Maintain backward compatibility during transition
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]* 2.2 Write unit tests for theme configuration structure
    - Test FONTS object has display and body properties
    - Test each font family has required weights
    - Test font fallback logic
    - _Requirements: 1.4_

- [x] 3. Create typography helper utilities
  - Create `src/utils/typography.ts` with font helper functions
  - Implement `getFontFamily()` function with error handling and fallbacks
  - Implement `validateThemeConfig()` function for configuration validation
  - Create TEXT_STYLES design tokens for common text styles (h1, h2, body, caption)
  - _Requirements: 1.1, 1.2_

- [ ] 4. Checkpoint - Verify font system foundation
  - Ensure all tests pass
  - Verify theme configuration is valid
  - Test font loading in development mode
  - Ask the user if questions arise

- [ ] 5. Update Splash Screen with enhanced branding
  - [x] 5.1 Modify `src/components/common/ModernSplashScreen.tsx`
    - Add tagline "Empowering the next generation" below logo
    - Apply Oswald font (display.semiBold) to tagline
    - Adjust spacing and layout for improved visual hierarchy
    - Maintain smooth transition animation
    - _Requirements: 2.1, 2.2_

  - [ ]* 5.2 Write unit tests for Splash Screen
    - Test tagline text is present
    - Test tagline uses Oswald font
    - Test animation completion callback
    - _Requirements: 2.1, 2.2_

- [ ] 6. Simplify Welcome Screen
  - [x] 6.1 Update `src/screens/auth/WelcomeScreen.tsx`
    - Simplify welcome copy using Noto Sans (body.regular)
    - Apply Oswald (display.bold) to main heading
    - Remove "Football for a new era" tagline if present
    - Update button labels with Oswald (display.medium)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write unit tests for Welcome Screen
    - Test "Football for a new era" is not present
    - Test heading uses Oswald font
    - Test body text uses Noto Sans font
    - _Requirements: 3.2, 3.4_

- [ ] 7. Enhance Sign-Up Method Screen
  - [x] 7.1 Update `src/screens/auth/SignUpMethodScreen.tsx`
    - Simplify instructions using Noto Sans (body.regular)
    - Apply Oswald (display.bold) to screen title
    - Update authentication method button labels with consistent typography
    - Improve visual hierarchy with proper spacing
    - _Requirements: 3.3, 3.4_

  - [ ]* 7.2 Write property test for onboarding typography consistency
    - **Property 3: Typography Consistency Across Screens**
    - **Validates: Requirements 3.4**
    - Generate random onboarding screen content
    - Verify headings use Oswald and body text uses Noto Sans
    - Run 100+ iterations

- [ ] 8. Improve Account Type Selection Screen
  - [ ] 8.1 Update Account Type Selection component
    - Enhance Individual account description with clear value propositions
    - Enhance Family account description with clear value propositions
    - Apply Oswald (display.semiBold) to account type titles
    - Apply Noto Sans (body.regular) to descriptions
    - Improve card layout and spacing
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 8.2 Write unit tests for Account Type Selection
    - Test account type titles use Oswald font
    - Test descriptions use Noto Sans font
    - Test both account types are displayed
    - _Requirements: 4.3, 4.4_

- [ ] 9. Enhance Personalization Flow
  - [ ] 9.1 Update personalization/interests screens
    - Improve copy for interests selection
    - Apply Oswald (display.semiBold) to section headings
    - Apply Noto Sans (body.regular) to interest descriptions
    - Ensure selection feedback uses consistent typography
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 9.2 Write unit tests for Personalization screens
    - Test section headings use Oswald font
    - Test descriptions use Noto Sans font
    - Test selection feedback typography
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 10. Checkpoint - Verify onboarding flow enhancements
  - Ensure all tests pass
  - Manually test complete onboarding flow
  - Verify smooth transitions and typography consistency
  - Ask the user if questions arise

- [ ] 11. Enhance Squads Screen
  - [ ] 11.1 Update Squads Screen component
    - Improve premium squad messaging
    - Apply Oswald (display.semiBold) to premium feature titles
    - Apply Noto Sans (body.regular) to benefit descriptions
    - Update call-to-action buttons with Oswald (display.medium)
    - Improve visual presentation of squad cards
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 11.2 Write unit tests for Squads Screen
    - Test premium feature titles use Oswald font
    - Test benefit descriptions use Noto Sans font
    - Test CTA button typography consistency
    - _Requirements: 6.2, 6.3, 6.4_

- [ ] 12. Expand Settings Screen
  - [ ] 12.1 Add new settings sections
    - Add Notifications section with push and email preferences
    - Add Privacy section with data sharing, visibility, blocked users options
    - Add Support section with help center, contact support, report issue, FAQ
    - Apply Oswald (display.semiBold) to category headers
    - Apply Noto Sans (body.regular) to setting labels and descriptions
    - Organize with visual separators
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 12.2 Write unit tests for Settings Screen
    - Test notification settings section exists
    - Test privacy settings section exists
    - Test support/help section exists
    - Test category headers use Oswald font
    - Test setting labels use Noto Sans font
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 12.3 Write property test for Settings typography
    - **Property 1: Display Font Consistency**
    - **Property 2: Body Font Consistency**
    - **Validates: Requirements 7.4, 7.5**
    - Generate random settings sections
    - Verify headers use Oswald and labels use Noto Sans
    - Run 100+ iterations

- [ ] 13. Improve Rewards Screen
  - [ ] 13.1 Update Rewards Screen component
    - Improve tier visuals with better graphics/icons
    - Enhance progress indicators with percentage display
    - Apply Oswald (display.bold) to tier names and levels
    - Apply Noto Sans (body.regular) to benefit descriptions
    - Display tier requirements clearly with consistent typography
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 13.2 Write unit tests for Rewards Screen
    - Test progress indicator displays
    - Test tier names use Oswald font
    - Test benefit descriptions use Noto Sans font
    - Test tier requirements display
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [ ]* 13.3 Write property test for Rewards typography
    - **Property 1: Display Font Consistency**
    - **Property 2: Body Font Consistency**
    - **Validates: Requirements 8.3, 8.4**
    - Generate random tier data
    - Verify tier names use Oswald and descriptions use Noto Sans
    - Run 100+ iterations

- [ ] 14. Enhance Profile Screen
  - [ ] 14.1 Update Profile Screen component
    - Add "Get Support" button/section
    - Add "Report Issue" option
    - Apply Oswald (display.semiBold) to section headings
    - Apply Noto Sans (body.regular) to user information and descriptions
    - Improve action button placement and typography
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 14.2 Write unit tests for Profile Screen
    - Test support/help button exists
    - Test report option exists
    - Test headings use Oswald font
    - Test user information uses Noto Sans font
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 15. Improve Family Controls
  - [ ] 15.1 Update Family Controls Screen component
    - Improve parent dashboard design with clear sections
    - Enhance approval queue interface
    - Apply Oswald (display.semiBold) to section headers
    - Apply Noto Sans (body.regular) to approval details and child information
    - Improve child profile cards with consistent typography
    - Maintain visual hierarchy throughout
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 15.2 Write unit tests for Family Controls
    - Test approval queue renders
    - Test child profile cards display
    - Test headers use Oswald font
    - Test details use Noto Sans font
    - _Requirements: 10.2, 10.3_

  - [ ]* 15.3 Write property test for Family Controls typography
    - **Property 3: Typography Consistency Across Screens**
    - **Validates: Requirements 10.4, 10.5**
    - Generate random family control screens
    - Verify headings use Oswald and body text uses Noto Sans
    - Run 100+ iterations

- [ ] 16. Final checkpoint - Comprehensive testing
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Test complete app flow with new typography
  - Verify font rendering on different Android devices
  - Test font loading performance
  - Verify app builds successfully
  - Ask the user if questions arise

- [ ] 17. Visual QA and polish
  - Capture screenshots of all enhanced screens
  - Verify visual hierarchy improvements
  - Ensure no layout breaks from font changes
  - Test with Android TalkBack screen reader
  - Verify font scaling with system font size settings
  - Make any final adjustments based on visual review

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across 100+ iterations
- Unit tests validate specific examples and edge cases
- Font files must be downloaded from Google Fonts or similar sources
- React Native may require app rebuild after adding new font files
- Test on multiple Android devices to ensure font rendering consistency
