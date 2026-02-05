import type { Preview } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const preview: Preview = {
    decorators: [
        (Story) => (
            <SafeAreaProvider>
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <Story />
                </View>
            </SafeAreaProvider>
        ),
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
            exclude: ['navigation', 'route'] // exclude navigation props from controls
        },
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#000000' },
                { name: 'light', value: '#ffffff' },
            ]
        }
    },
};

export default preview;
