/**
 * Basic setup test for React Native 0.75.4 compatibility
 * This test validates that the basic environment is configured correctly
 */

describe('iOS Build Compatibility Setup', () => {
  test('React Native version is 0.75.4', () => {
    const packageJson = require('../package.json');
    expect(packageJson.dependencies['react-native']).toBe('0.75.4');
  });

  test('Node.js engine requirement is >= 18', () => {
    const packageJson = require('../package.json');
    expect(packageJson.engines.node).toBe('>=18');
  });

  test('Firebase SDK version is compatible', () => {
    const packageJson = require('../package.json');
    const firebaseApp = packageJson.dependencies['@react-native-firebase/app'];
    expect(firebaseApp).toBeDefined();
    expect(firebaseApp).toMatch(/^[\^~]?21\./); // Should be version 21.x
  });

  test('Required dependencies are present', () => {
    const packageJson = require('../package.json');
    const requiredDeps = [
      'react-native',
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-firebase/firestore',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'react-native-screens',
      'react-native-safe-area-context'
    ];

    requiredDeps.forEach(dep => {
      expect(packageJson.dependencies[dep]).toBeDefined();
    });
  });
});