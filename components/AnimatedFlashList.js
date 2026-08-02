import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const AnimatedFlashListCore = Animated.createAnimatedComponent(FlashList);
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// A reusable HOC for FlashList to expose animated scroll values
export const AnimatedFlashList = React.forwardRef(({ 
  data, 
  renderItem, 
  onScroll, 
  scrollEventThrottle = 16, 
  decelerationRate = "normal", 
  ...rest 
}, ref) => {
  const scrollY = useSharedValue(0);
  const { graphicsQuality, fpsLimit } = useTheme();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (onScroll) {
        // Unfortunately standard react-native-reanimated scroll handlers can't easily bridge 
        // back to JS thread smoothly without runOnJS. Since we want pure UI thread performance,
        // we keep it local. If the parent needs the event, they should pass their own useAnimatedScrollHandler.
      }
    },
  });

  const throttleValue = fpsLimit === '120' ? 1 : fpsLimit === '90' ? 11 : fpsLimit === '30' ? 32 : 16;

  return (
    <AnimatedFlashListCore
      ref={ref}
      data={data}
      renderItem={(info) => renderItem({ ...info, scrollY })}
      onScroll={onScroll || scrollHandler}
      scrollEventThrottle={throttleValue}
      decelerationRate={decelerationRate}
      showsVerticalScrollIndicator={false}
      {...rest}
    />
  );
});

// A wrapper to apply the Lenis-like scaling and fading effect to cards
export const AnimatedScrollCard = ({ index, itemHeight, scrollY, children, style }) => {
  const { graphicsQuality } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY || graphicsQuality === 'low' || graphicsQuality === 'potato') return {};

    const itemPosition = index * itemHeight;
    const distanceFromTop = itemPosition - scrollY.value;

    const scale = interpolate(
      distanceFromTop,
      [-itemHeight, 0, SCREEN_HEIGHT - 250, SCREEN_HEIGHT],
      [0.85, 1, 1, 0.85],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      distanceFromTop,
      [-itemHeight, 0, SCREEN_HEIGHT - 250, SCREEN_HEIGHT],
      [0.2, 1, 1, 0.2],
      Extrapolation.CLAMP
    );

    let transform = [{ scale }];

    // Extreme Graphics gets 3D rotational tilt effects for world-class cinematic feel
    if (graphicsQuality === 'extreme') {
      const rotateX = interpolate(
        distanceFromTop,
        [-itemHeight, 0, SCREEN_HEIGHT - 250, SCREEN_HEIGHT],
        [15, 0, 0, -15],
        Extrapolation.CLAMP
      );
      transform.push({ rotateX: `${rotateX}deg` });
    }

    return {
      transform,
      opacity,
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
