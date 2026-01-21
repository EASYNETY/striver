module.exports = {
    root: true,
    extends: '@react-native',
    rules: {
        'prettier/prettier': 0, // Disable prettier rules in eslint to stop the 14k errors
        'react-native/no-inline-styles': 0,
        '@typescript-eslint/no-shadow': 0,
        'no-trailing-spaces': 0,
        'react/react-in-jsx-scope': 0,
    },
};
