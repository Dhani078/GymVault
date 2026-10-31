# GymVault Anatomical Taxonomy & Kinetic Chain Intelligence

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Overview

GymVault includes a biomechanical intelligence engine designed to map exercise naming patterns to anatomical muscle groups, calculate central nervous system (CNS) fatigue decay curves, detect kinetic chain stabilizer overlap, and guide progressive overload.

This system guarantees that lifters neither under-train below Minimum Effective Volume (MEV) nor over-train past Maximum Recoverable Volume (MRV).

---

## 2. The 12 Primary Muscle Groups

GymVault models human skeletal musculature across 12 distinct anatomical zones:

| Code | Muscle Group (EN) | Muscle Group (ID) | Latin Classification | Primary Function |
| ---- | ----------------- | ----------------- | -------------------- | ---------------- |
| chest | Chest | Dada | Pectoralis Major & Minor | Horizontal Adduction, Flexion |
| back | Upper & Middle Back | Punggung Atas | Latissimus Dorsi, Rhomboids | Scapular Retraction, Depression |
| shoulders | Deltoids | Bahu | Anterior, Lateral, Posterior Deltoid | Shoulder Abduction, Overhead Press |
| biceps | Biceps | Lengan Depan | Biceps Brachii, Brachialis | Elbow Flexion, Forearm Supination |
| triceps | Triceps | Lengan Belakang | Triceps Brachii (3 Heads) | Elbow Extension |
| quads | Quadriceps | Paha Depan | Quadriceps Femoris (4 Heads) | Knee Extension |
| hamstrings | Hamstrings | Paha Belakang | Biceps Femoris, Semitendinosus | Knee Flexion, Hip Extension |
| glutes | Glutes | Bokong | Gluteus Maximus, Medius, Minimus | Hip Extension, External Rotation |
| calves | Calves | Betis | Gastrocnemius, Soleus | Ankle Plantarflexion |
| abs | Core & Abdominals | Perut & Inti | Rectus Abdominis, Obliques | Trunk Flexion, Anti-Rotation |
| lower_back | Spinal Erectors | Punggung Bawah | Erector Spinae | Spinal Extension, Core Stability |
| traps | Trapezius | Punggung Leher | Trapezius (Upper, Mid, Lower) | Scapular Elevation & Upward Rotation |

---

## 3. CNS Fatigue & Muscle Recovery Decay Engine

Muscle tissue recovery is calculated as a continuous logarithmic decay function based on elapsed hours since the last intense stimulus:

### Mathematical Model
Recovery Score R(t) in percent:
- t < 2 hours: R(t) <= 25% (Severely Fatigued)
- t = 24 hours: R(t) = 45% (Recovering Phase)
- t = 48 hours: R(t) = 75% (Substantially Recovered)
- t >= 72 to 80 hours: R(t) = 100% (Fresh / Prime for Hypertrophy)

### Compound Lift Multipliers
High-threshold motor unit lifts apply heavier fatigue tax on systemic recovery:
- Barbell Deadlift: 1.4x systemic fatigue coefficient (96 hours baseline recovery)
- Barbell Back Squat: 1.3x systemic fatigue coefficient (72 hours baseline recovery)
- Barbell Overhead Press: 1.1x systemic fatigue coefficient (48 hours baseline recovery)
- Dumbbell Lateral Raise: 0.8x systemic fatigue coefficient (36 hours baseline recovery)

---

## 4. Kinetic Chain Overlap & Stabilizer Warnings

To prevent acute tendonitis, lumbar strain, and overuse injuries, the engine continuously inspects workout history across compound patterns:

1. Posterior Chain Exhaustion Warning
- Trigger: Heavy Squats attempted within 24 hours of Deadlifts.
- Biomechanical Reason: Lumbar erectors and hamstrings are heavily taxed as secondary stabilizers during back squats. Fatigued erectors increase risk of lumbar flexion under axial load.
- Engine Action: Surfaces warning in LoggerScreen recommending reducing intensity or substituting with Leg Press / Belt Squat.

2. Anterior Shoulder Overuse Warning
- Trigger: Overhead Press attempted within 24 hours of Heavy Incline Bench Press.
- Biomechanical Reason: Anterior deltoids are prime movers in incline pressing. Consecutive training without 48-hour recovery risks subacromial impingement.
- Engine Action: Recommends Lateral Raises or Face Pulls to emphasize lateral and posterior deltoids.

---

## 5. Hypertrophy Volume Landmarks (Per Week)

GymVault benchmarks weekly direct working sets against established sports science landmarks:

- Under MEV (Minimum Effective Volume): Less than 6 direct sets per week. Insufficient stimulus for progressive muscular adaptation.
- Optimal MAV (Maximum Adaptive Volume): 10 to 18 direct sets per week. Optimal stimulus-to-fatigue ratio for hypertrophy and strength gains.
- Over MRV (Maximum Recoverable Volume): Greater than 24 direct sets per week. Accumulates excessive fatigue, degrading performance and increasing injury probability.
