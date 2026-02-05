# Design Document: UI/UX Improvements

## Overview

This design document outlines the technical approach for implementing comprehensive UI/UX improvements across the Striver mobile application. The improvements focus on three main areas:

1. **Typography System Overhaul**: Replacing Outfit font with Oswald (display) and Noto Sans (body)
2. **Onboarding Flow Enhancement**: Improving splash screen, sign-up, and personalization experiences
3. **Main App Screen Improvements**: Enhancing Squads, Settings, Rewards, Profile, and Family Controls screens

The design maintains backward compatibility with existing functionality while introducing improved visual hierarchy, clearer messaging, and better user experience across all touchpoints.

## Architecture

### High-Level Component Structure

```
App
├── Theme System (src/constants/theme.ts)
│   ├── Font Configuration (Oswald + Noto Sans)
│   ├── Color Palette
│   └── Spacing System
│
├── Onboarding Flow
│   ├── ModernSplashScreen (Enhanced)
│   ├── WelcomeScreen (Simplified)
│   ├── SignUpMethodScreen (Simplified)
│   ├── AccountTypeSelection (Enhanced)
│   └── PersonalizationFlow (Improved)
│
└── Main App Screens
    ├── SquadsScreen (Enhanced Premium Messaging)
    ├── SettingsScreen (Expanded Options)
    ├── RewardsScreen (Improved Visuals)
    ├── ProfileScreen (Support/Report Options)
    └── FamilyControlsScreen (Better Dashboard)
```

### Font System Architecture

The font system will be restructured to support two distinct font families:

- **Display Font (Oswald)**: Used for headings, titles, prominent UI elements
- **Body Font (Noto Sans)**: Used for descriptions, labels, general content

```typescript
// New Font System Structure
FONTS = {
  display: {
    bold: 'Oswald-Bold',
    semiBold: 'Oswald-SemiBold', 
    medium: 'Oswald-Medium',
    regular: 'Oswald-Regular',
  },
  body: {
    bold: 'NotoSans-Bold',
    semiBold: 'NotoSans-SemiBold',
    medium: 'NotoSans-Medium',
    regular: 'NotoSans-Regular',
    light: 'NotoSans-Light',
  }
}
```

## Components and Interfaces

### 1. Theme Configuration Module

**File**: `src/constants/theme.ts`

**Interface**:
```typescript
interface FontFamily {
  bold: string;
  semiBold: string;
  medium: string;
  regular: string;
  light?: string;
}

interface ThemeConfig {
  COLORS: ColorPalette;
  SPACING: SpacingSystem;
  FONTS: {
    display: FontFamily;
    body: FontFamily;
  };
}
```

**Responsibilities**:
- Define font family mappings for Oswald and Noto Sans
- Maintain color palette and spacing constants
- Export centralized theme configuration for app-wide use

### 2. Splash Screen Component

**File**: `src/components/common/ModernSplashScreen.tsx`

**Interface**:
```typescript
interface SplashScreenProps {
  onAnimationComplete: () => void;
}
```

**Enhancements**:
- Add tagline "Empowering the next generation" below logo
- Use Oswald font for tagline
- Improve visual hierarchy with better spacing
- Maintain smooth fade-out transition

### 3. Welcome Screen Component

**File**: `src/screens/auth/WelcomeScreen.tsx`

**Enhancements**:
- Simplify welcome copy using Noto Sans
- Use Oswald for main heading
- Remove "Football for a new era" tagline
- Streamline call-to-action buttons

### 4. Sign-Up Method Screen

**File**: `src/screens/auth/SignUpMethodScreen.tsx`

**Enhancements**:
- Simplify instructions using Noto Sans
- Use Oswald for screen title
- Improve button hierarchy with consistent typography
- Clarify authentication method options

### 5. Account Type Selection Screen

**File**: `src/screens/auth/AccountTypeSelectionScreen.tsx` (or similar)

**Interface**:
```typescript
interface AccountTypeOption {
  type: 'individual' | 'family';
  title: string;
  description: string;
  benefits: string[];
}
```

**Enhancements**:
- Enhanced descriptions for Individual accounts (Oswald titles, Noto Sans descriptions)
- Enhanced descriptions for Family accounts (Oswald titles, Noto Sans descriptions)
- Clear value propositions with bullet points
- Improved visual cards with better spacing

### 6. Personalization Flow Screens

**Files**: Various onboarding screens for interests/preferences

**Enhancements**:
- Improved copy for interest selection (Noto Sans)
- Section headings in Oswald
- Clear selection feedback
- Better visual grouping of options

### 7. Squads Screen Component

**File**: `src/screens/main/SquadsScreen.tsx` (or similar)

**Enhancements**:
- Premium squad messaging with Oswald titles
- Benefit descriptions in Noto Sans
- Clear call-to-action for premium upgrade
- Improved visual presentation of squad cards

### 8. Settings Screen Component

**File**: `src/screens/main/SettingsScreen.tsx` (or similar)

**Interface**:
```typescript
interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  label: string;
  description?: string;
  type: 'toggle' | 'navigation' | 'action';
  onPress?: () => void;
}
```

**New Sections**:
- **Notifications**: Push notification preferences, email preferences
- **Privacy**: Data sharing, account visibility, blocked users
- **Support**: Help center, contact support, report issue, FAQ

**Enhancements**:
- Category headers in Oswald
- Setting labels and descriptions in Noto Sans
- Better organization with visual separators
- Improved navigation hierarchy

### 9. Rewards Screen Component

**File**: `src/screens/main/RewardsScreen.tsx` (or similar)

**Interface**:
```typescript
interface TierInfo {
  name: string;
  level: number;
  color: string;
  benefits: string[];
  requirements: {
    current: number;
    target: number;
    unit: string;
  };
}
```

**Enhancements**:
- Improved tier visuals with better graphics/icons
- Enhanced progress bar with percentage display
- Tier names in Oswald
- Benefit descriptions in Noto Sans
- Clear requirements display

### 10. Profile Screen Component

**File**: `src/screens/main/ProfileScreen.tsx` (or similar)

**Enhancements**:
- Add "Get Support" button/section
- Add "Report Issue" option
- Improved layout with Oswald headings
- User information in Noto Sans
- Better action button placement

### 11. Family Controls Component

**File**: `src/screens/main/FamilyControlsScreen.tsx` (or similar)

**Interface**:
```typescript
interface ParentDashboard {
  children: ChildProfile[];
  pendingApprovals: Approval[];
}

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  tier: string;
  activitySummary: ActivitySummary;
}

interface Approval {
  id: string;
  childId: string;
  type: 'purchase' | 'content' | 'friend_request';
  details: string;
  timestamp: Date;
}
```

**Enhancements**:
- Better parent dashboard design with Oswald headers
- Enhanced approval queue interface
- Child profile cards with Noto Sans details
- Clear approve/deny actions
- Visual hierarchy throughout

## Data Models

### Font Configuration Model

```typescript
interface FontConfig {
  display: {
    bold: string;
    semiBold: string;
    medium: string;
    regular: string;
  };
  body: {
    bold: string;
    semiBold: string;
    medium: string;
    regular: string;
    light: string;
  };
}
```

### Typography Usage Guidelines

```typescript
interface TypographyGuidelines {
  // Display Font (Oswald) Usage
  displayUsage: {
    screenTitles: 'display.bold';
    sectionHeaders: 'display.semiBold';
    cardTitles: 'display.medium';
    buttonLabels: 'display.regular';
  };
  
  // Body Font (Noto Sans) Usage
  bodyUsage: {
    paragraphs: 'body.regular';
    descriptions: 'body.regular';
    labels: 'body.medium';
    captions: 'body.light';
    emphasis: 'body.semiBold';
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Display Font Consistency

*For any* screen component that renders display text (headings, titles, section headers, button labels), the component SHALL use a font from the Oswald family (display.bold, display.semiBold, display.medium, or display.regular) as defined in the theme configuration.

**Validates: Requirements 1.1, 3.4, 4.4, 5.3, 6.2, 7.4, 8.3, 9.3, 10.2**

### Property 2: Body Font Consistency

*For any* screen component that renders body text (descriptions, labels, paragraphs, captions, user information), the component SHALL use a font from the Noto Sans family (body.bold, body.semiBold, body.medium, body.regular, or body.light) as defined in the theme configuration.

**Validates: Requirements 1.2, 3.3, 4.3, 5.2, 6.3, 7.5, 8.4, 9.4, 10.3**

### Property 3: Typography Consistency Across Screens

*For any* screen in the application, when the screen contains both headings and body text, the headings SHALL use Oswald fonts and the body text SHALL use Noto Sans fonts, maintaining consistent visual hierarchy throughout the application.

**Validates: Requirements 3.4, 5.4, 6.4, 8.5, 9.5, 10.4, 10.5**

## Error Handling

### Font Loading Failures

**Scenario**: Font files fail to load or are missing

**Handling**:
- Implement fallback to system default fonts (sans-serif)
- Log error to monitoring service
- Display user-friendly error message if fonts critical to branding
- Graceful degradation: app remains functional with system fonts

**Implementation**:
```typescript
const getFontFamily = (fontType: 'display' | 'body', weight: string): string => {
  try {
    const fontFamily = FONTS[fontType][weight];
    if (!fontFamily || !isFontLoaded(fontFamily)) {
      console.warn(`Font ${fontFamily} not loaded, using fallback`);
      return Platform.select({
        ios: 'System',
        android: 'sans-serif',
      });
    }
    return fontFamily;
  } catch (error) {
    logError('Font loading error', error);
    return 'sans-serif';
  }
};
```

### Theme Configuration Errors

**Scenario**: Theme configuration is malformed or missing font definitions

**Handling**:
- Validate theme configuration on app initialization
- Throw descriptive error in development mode
- Use safe defaults in production mode
- Log configuration errors for debugging

**Implementation**:
```typescript
const validateThemeConfig = (config: ThemeConfig): boolean => {
  if (!config.FONTS?.display || !config.FONTS?.body) {
    if (__DEV__) {
      throw new Error('Theme configuration missing font definitions');
    }
    console.error('Invalid theme configuration, using defaults');
    return false;
  }
  return true;
};
```

### Screen Component Rendering Errors

**Scenario**: Enhanced screen components fail to render due to missing props or data

**Handling**:
- Implement error boundaries around major screen components
- Provide fallback UI for failed components
- Log errors with component context
- Allow user to retry or navigate away

**Implementation**:
```typescript
class ScreenErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('Screen rendering error', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <FallbackScreen onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and UI element presence
- Verify specific strings appear/don't appear on screens
- Check that required UI elements exist (buttons, sections, options)
- Test theme configuration structure
- Verify font file existence in assets directory
- Test error handling scenarios

**Property Tests**: Verify universal properties across all inputs
- Font consistency across all screen components
- Typography hierarchy maintenance
- Theme configuration validity

### Property-Based Testing Configuration

**Library**: Use `fast-check` for React Native property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: **Feature: ui-ux-improvements, Property {number}: {property_text}**

### Unit Testing Focus Areas

1. **Theme Configuration**
   - Verify FONTS object has display and body properties
   - Verify each font family has required weights
   - Test font fallback logic

2. **Splash Screen**
   - Verify tagline text is present
   - Verify tagline uses Oswald font
   - Test animation completion callback

3. **Onboarding Screens**
   - Verify "Football for a new era" is removed
   - Test account type descriptions are present
   - Verify interest selection feedback

4. **Settings Screen**
   - Verify notification settings section exists
   - Verify privacy settings section exists
   - Verify support/help section exists

5. **Rewards Screen**
   - Verify progress indicator displays
   - Test tier requirement calculations

6. **Profile Screen**
   - Verify support/help button exists
   - Verify report option exists

7. **Family Controls**
   - Test approval queue rendering
   - Verify child profile cards display

### Property Testing Focus Areas

1. **Font Consistency (Property 1 & 2)**
   - Generate random screen components with display/body text
   - Verify all display text uses Oswald
   - Verify all body text uses Noto Sans

2. **Typography Hierarchy (Property 3)**
   - Generate random screens with mixed content
   - Verify headings always use Oswald
   - Verify body text always uses Noto Sans

### Integration Testing

- Test complete onboarding flow with new typography
- Verify smooth transitions between screens
- Test font rendering on different Android devices
- Verify app builds successfully with new fonts
- Test font loading performance

### Visual Regression Testing

- Capture screenshots of all enhanced screens
- Compare before/after typography changes
- Verify visual hierarchy improvements
- Ensure no layout breaks from font changes

## Implementation Notes

### Font File Requirements

Download and include the following font files in `assets/fonts/`:

**Oswald**:
- Oswald-Regular.ttf
- Oswald-Medium.ttf
- Oswald-SemiBold.ttf
- Oswald-Bold.ttf

**Noto Sans**:
- NotoSans-Regular.ttf
- NotoSans-Medium.ttf
- NotoSans-SemiBold.ttf
- NotoSans-Bold.ttf
- NotoSans-Light.ttf

### React Native Configuration

Update `react-native.config.js` to include font assets (if not already configured):

```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'],
  // ... existing configuration
};
```

### Migration Strategy

1. **Phase 1**: Update theme configuration with new fonts
2. **Phase 2**: Update splash screen and onboarding flow
3. **Phase 3**: Update main app screens (Squads, Settings, Rewards)
4. **Phase 4**: Update Profile and Family Controls
5. **Phase 5**: Comprehensive testing and visual QA

### Performance Considerations

- Font files should be optimized for mobile (subset if possible)
- Lazy load fonts if bundle size becomes an issue
- Monitor app startup time after font changes
- Consider font preloading for critical screens

### Accessibility Considerations

- Ensure font sizes meet minimum accessibility standards (16sp for body text)
- Maintain sufficient contrast ratios with new typography
- Test with Android TalkBack screen reader
- Verify font scaling works with system font size settings

### Design Tokens

Consider creating design tokens for common text styles:

```typescript
export const TEXT_STYLES = {
  h1: {
    fontFamily: FONTS.display.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  body: {
    fontFamily: FONTS.body.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONTS.body.light,
    fontSize: 14,
    lineHeight: 20,
  },
  // ... more styles
};
```

This approach ensures consistency and makes it easier to apply typography changes globally.
