import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface DiagonalStreaksBackgroundProps {
  opacity?: number;
  streakCount?: number;
}

export const DiagonalStreaksBackground: React.FC<DiagonalStreaksBackgroundProps> = ({ 
  opacity = 0.15, 
  streakCount = 25 
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.streaksContainer}>
        {[...Array(streakCount)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.streak,
              {
                left: `${i * (100 / streakCount)}%`,
                opacity: i % 3 === 0 ? opacity * 1.5 : i % 2 === 0 ? opacity : opacity * 0.5,
                width: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  streaksContainer: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
  },
  streak: {
    position: 'absolute',
    height: '200%',
    backgroundColor: COLORS.primary,
    top: '-50%',
  },
});
