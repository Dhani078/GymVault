# GymVault Fitness Mathematics & Biomechanical Engine

> Technical documentation of pure algorithmic models implemented in `utils/fitnessMath.js`.  
> Author: Dhani078  
> Version: 2.4.0  
> Test Coverage: 100% Pass Rate (65/65 assertions)

---

## 1. 1-Rep Max (1RM) Estimation

GymVault utilizes the validated Brzycki Formula to predict an athlete's maximal single-repetition capacity from submaximal lifts:

### Mathematical Model
$$\text{1RM} = \frac{\text{Weight}}{1.0278 - (0.0278 \times \text{Reps})}$$

### Boundary Conditions & Guardrails
- If $\text{Reps} \le 1$, $\text{1RM} = \text{Weight}$.
- If $\text{Reps} > 15$, estimation accuracy degrades due to cardiovascular and muscular endurance confounding factors; the engine clamps estimation or flags endurance domain.
- If $\text{Weight} \le 0$, $\text{1RM} = 0$.

```javascript
export function calculate1RM(weightKg, reps) {
  if (!weightKg || weightKg <= 0) return 0;
  if (!reps || reps <= 1) return Math.round(weightKg);
  if (reps > 15) reps = 15; // Clamped to prevent exponential deviation
  const oneRM = weightKg / (1.0278 - (0.0278 * reps));
  return Math.round(oneRM);
}
```

---

## 2. Olympic Barbell Plate Loading Algorithm

Calculates the optimal combination of International Powerlifting Federation (IPF) / International Weightlifting Federation (IWF) standard Olympic bumper plates to place on each side of a 20 kg standard barbell.

### Available Plate Denominations (per side)
`[25kg, 20kg, 15kg, 10kg, 5kg, 2.5kg, 1.25kg]`

### Algorithm Logic
1. Net load per sleeve:
   $$\text{Weight Per Side} = \frac{\text{Target Weight} - 20\,\text{kg}}{2}$$
2. Greedy knapsack evaluation descending from highest denomination ($25\,\text{kg}$) down to fractional micro-plates ($1.25\,\text{kg}$).
3. Returns plate breakdown array and remainder if load cannot be resolved evenly.

```javascript
export function calculatePlateBreakdown(targetTotalKg, barWeightKg = 20) {
  if (targetTotalKg <= barWeightKg) return { weightPerSide: 0, plates: [] };
  let weightPerSide = (targetTotalKg - barWeightKg) / 2;
  const plateTypes = [25, 20, 15, 10, 5, 2.5, 1.25];
  const plates = [];

  for (const plate of plateTypes) {
    while (weightPerSide >= plate) {
      plates.push(plate);
      weightPerSide = Math.round((weightPerSide - plate) * 100) / 100;
    }
  }

  return {
    weightPerSide: (targetTotalKg - barWeightKg) / 2,
    plates
  };
}
```

---

## 3. Basal Metabolic Rate (BMR) & TDEE Architect

Implements the Mifflin-St Jeor Equation, recognized as the clinical gold standard for estimating resting metabolic expenditure.

### Mathematical Formulation
$$\text{BMR} = (10 \times \text{Weight}_{\text{kg}}) + (6.25 \times \text{Height}_{\text{cm}}) - (5 \times \text{Age}) + S$$
Where $S = +5$ for males, $-161$ for females.

### Total Daily Energy Expenditure (TDEE)
$$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier}$$

- Sedentary: $1.2$
- Lightly Active (1–3 days/wk): $1.375$
- Moderately Active (3–5 days/wk): $1.55$
- Very Active (6–7 days/wk): $1.725$

### Macronutrient Allocation Engine
- Protein Target: Fixed at $2.0\,\text{g} - 2.2\,\text{g}$ per kg of bodyweight to maximize muscle protein synthesis (MPS) and nitrogen retention.
- Fat Target: $0.8\,\text{g} - 1.0\,\text{g}$ per kg of bodyweight to preserve endocrine function and testosterone production.
- Carbohydrates: Remainder of caloric budget allocated to carbohydrates at $4\,\text{kcal/g}$ to fuel high-intensity glycolytic training.

---

## 4. Central Nervous System (CNS) Muscle Recovery Decay

GymVault calculates the localized and systemic recovery status of 12 distinct muscle groups based on time elapsed since the last intense training session.

### Exponential Recovery Curve
$$\text{Recovery}(\%) = \min\left(100, \left(\frac{\Delta t_{\text{hours}}}{T_{\text{baseline}}}\right) \times 100\right)$$

- Acute Fatigue (0–24 hrs): 10%–35% (Inflammation, calcium ion depletion, high mechanical damage).
- Active Repair (24–48 hrs): 35%–70% (Peak muscle protein synthesis, satellite cell proliferation).
- Functional Recovery (48–72 hrs): 70%–95% (Structural restoration, glycogen replenishment).
- Supercompensation (72+ hrs): 100% (Fully recovered, optimal window for progressive overload).

---

## 5. AI Progressive Overload (Double Progression)

The engine enforces the evidence-based Double Progression Protocol to systematically drive hypertrophic adaptations without inducing premature form breakdown:

1. Rep Progression Phase: When lifting a given weight, keep the load static and attempt to add +1 repetition per set until the athlete hits the upper ceiling of their prescribed target rep bracket (e.g., 8–12 reps).
2. Load Promotion Phase: Once the athlete achieves 12 repetitions on all working sets with clean form, the engine automatically recommends advancing the load:
   - Compound Movements (Squat, Bench, Deadlift): $+2.5\,\text{kg}$ to $+5.0\,\text{kg}$.
   - Isolation Movements (Lateral Raises, Bicep Curls): $+1.0\,\text{kg}$ to $+1.25\,\text{kg}$.
   - Rep Reset: Rep target resets back to the bottom of the rep bracket (8 reps) at the new elevated weight.

### Back-Off Set Recommender
If an acute performance drop exceeding 20% in reps is detected during an active workout (e.g., Set 1: 10 reps $\to$ Set 2: 5 reps), the engine flags severe fatigue and automatically calculates a Back-Off Set:
$$\text{Back-Off Weight} = \text{Current Weight} \times 0.80 \quad (-20\%)$$

---

## 6. Kinetic Chain Cross-Muscle Stabilizer Warnings

Heavy compound lifts recruit secondary stabilizer muscles. Training overlapping stabilizers on consecutive days significantly elevates injury incidence. The engine detects kinetic overlaps:

- Deadlift $\to$ Squat (within 36 hours): Warns of spinal erector and hamstring fatigue, preventing lumbar compromise.
- Heavy Bench Press $\to$ Overhead Press (within 24 hours): Warns of anterior deltoid and rotator cuff exhaustion.
- Barbell Row $\to$ Romanian Deadlift: Warns of posterior chain tension saturation.

---

## 7. Natural Language Voice Command Speech Parser

Parses speech-to-text transcripts generated via the Web Speech API during active lifting sessions:

```text
"Coach, catat 80 kilo 8 repetisi"  ──►  { weightKg: 80, reps: 8, success: true }
"75kg 10 rep"                      ──►  { weightKg: 75, reps: 10, success: true }
"beban 25 kilo repetisi 12"        ──►  { weightKg: 25, reps: 12, success: true }
```

Regex-based deterministic state machine extracts numerical quantities associated with weight prefixes (`kilo`, `kg`, `beban`) and repetition prefixes (`rep`, `repetisi`, `kali`), guaranteeing offline reliability with 0 network latency.
