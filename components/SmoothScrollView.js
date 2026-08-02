import React, { useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const SmoothScrollView = ({
  children,
  style,
  contentContainerStyle,
  onScrollPosition,
  headerParallaxHeight = 0,
  renderHeaderParallax,
  showsVerticalScrollIndicator = false,
  ...rest
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { graphicsQuality, fpsLimit } = useTheme();

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        if (onScrollPosition && event?.nativeEvent?.contentOffset) {
          onScrollPosition(event.nativeEvent.contentOffset.y);
        }
      },
    }
  );

  const throttleValue = fpsLimit === '120' ? 1 : fpsLimit === '90' ? 11 : fpsLimit === '30' ? 32 : 16;

  return (
    <View style={[{ flex: 1 }, style]}>
      {renderHeaderParallax && headerParallaxHeight > 0 && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerParallaxHeight, zIndex: 0 }}>
          {renderHeaderParallax(scrollY)}
        </View>
      )}
      <Animated.ScrollView
        {...rest}
        onScroll={handleScroll}
        scrollEventThrottle={throttleValue}
        decelerationRate={0.988}
        bounces={true}
        overScrollMode="always"
        removeClippedSubviews={graphicsQuality !== 'high' && graphicsQuality !== 'extreme'}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[
          headerParallaxHeight > 0 ? { paddingTop: headerParallaxHeight } : null,
          contentContainerStyle,
        ]}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
};

export default SmoothScrollView;
