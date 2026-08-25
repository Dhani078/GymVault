---
name: motion
description: Master animation and interaction guide for Motion and Framer Motion across React, Next.js, JavaScript, and Vue. Provides rules for 120fps GPU-accelerated transitions, gesture handling, spring physics, layout animations, exit animations, and scroll-linked effects.
---

# Motion & Framer Motion Skill Guide

> Unified intelligence and best practices for **Motion** (`motion/react`, `framer-motion`, and `@motionone`).

---

## 1. Core Principles

1. **Import Source**:
   - Modern React / Next.js: `import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "motion/react"` (or `framer-motion`).
   - Pure JS: `import { animate, scroll, inView, timeline } from "motion"`.
2. **GPU Acceleration (120fps)**:
   - Prefer animating `transform` (`x`, `y`, `scale`, `rotate`, `skew`) and `opacity`.
   - Avoid animating layout-triggering properties like `width`, `height`, `top`, `left`, `margin` directly unless using `layout` or `layoutId`.
3. **Reduced Motion Respect**:
   - Always honor `useReducedMotion()` or `@media (prefers-reduced-motion: reduce)`.
4. **Spring Physics vs Easing**:
   - Use spring physics for natural tactile UI interactions (`type: "spring", stiffness: 300, damping: 25`).
   - Use cubic-bezier curves for cinematic/timed sequences (`ease: [0.16, 1, 0.3, 1]`).

---

## 2. Common Patterns & Code Recipes

### A. Entrance & Stagger Animation
```tsx
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 }
  },
};

export function StaggerList({ items }: { items: string[] }) {
  return (
    <motion.ul variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item, i) => (
        <motion.li key={i} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### B. Interactive Hover & Tap Gestures
```tsx
<motion.button
  whileHover={{ scale: 1.04, y: -2 }}
  whileTap={{ scale: 0.96, y: 0 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  className="px-6 py-3 rounded-xl bg-accent text-black font-semibold shadow-lg hover:shadow-accent/25"
>
  Explore Works
</motion.button>
```

### C. Scroll-Linked Parallax & Progress
```tsx
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.4]);

  return (
    <div ref={ref} className="relative overflow-hidden py-24">
      <motion.div style={{ y, opacity }}>
        <h2>Dynamic Scroll Experience</h2>
      </motion.div>
    </div>
  );
}
```

### D. Layout Morphing (`layoutId`)
```tsx
import { motion } from 'motion/react';
import { useState } from 'react';

export function SegmentedTabs({ tabs }: { tabs: string[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="flex gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="relative px-4 py-2 text-sm font-medium rounded-xl transition-colors"
        >
          {activeTab === tab && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-neutral-800 rounded-xl"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 text-white">{tab}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## 3. Pre-Flight Animation Checklist
- [ ] No layout jumps during unmount (use `<AnimatePresence mode="wait">`).
- [ ] `willChange: "transform, opacity"` applied where micro-stutters might occur.
- [ ] All clickable and hoverable elements maintain accessible focus rings.
- [ ] Touch gestures handle touch canceling cleanly without locking scrolling.
