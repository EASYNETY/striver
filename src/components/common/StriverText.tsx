import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { FONTS } from '../../constants/theme';

interface StriverTextProps extends TextProps {
    variant?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'light';
}

const StriverText: React.FC<StriverTextProps> = ({
    style,
    variant = 'regular',
    children,
    ...props
}) => {
    return (
        <Text
            style={[
                styles.base,
                { fontFamily: FONTS[variant] },
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    base: {
        color: '#FFFFFF',
    },
});

export default StriverText;
