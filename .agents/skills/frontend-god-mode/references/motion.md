# Motion & Interaction System — Frontend God Mode

## 120 FPS GPU-Accelerated Principles
- Only animate `transform` (`x`, `y`, `scale`, `rotate`, `rotateX`, `rotateY`) and `opacity`.
- Never animate layout properties like `height`, `width`, `top`, `left`, `margin`, or `padding` directly without `layout` or `layoutId`.

## Standard Spring Physics Curves
```ts
export const appleSpring = { type: 'spring', stiffness: 280, damping: 30 };
export const snappySpring = { type: 'spring', stiffness: 380, damping: 28 };
export const gentleSpring = { type: 'spring', stiffness: 180, damping: 24 };
```

## 3D Gyroscope Mouse Tilt Architecture
```tsx
const mouseX = useMotionValue(0);
const mouseY = useMotionValue(0);
const rotateX = useSpring(useTransform(mouseY, [-150, 150], [7, -7]), { stiffness: 300, damping: 30 });
const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-7, 7]), { stiffness: 300, damping: 30 });
```

## Liquid Segmented Indicators
Always use `layoutId="uniqueIndicatorName"` inside Framer Motion to morph pill highlights smoothly across tabs.
