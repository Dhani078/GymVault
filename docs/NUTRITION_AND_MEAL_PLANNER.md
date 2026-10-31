# GymVault Nutrition Engine & Smart Fridge Chef Specification

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Overview

Nutrition accounts for over 70% of body recomposition and athletic recovery. GymVault integrates a mathematical nutritional architect and visual food scanner that aligns daily calorie and macronutrient targets with training volume and CNS recovery states.

Core modules:
- utils/fitnessMath.js (TDEE & Macro Calculations)
- components/NutritionWidget.js (Daily Dashboard & Calorie Rings)
- screens/NutritionScannerModal.js (Vision AI Food Camera)
- services/NutritionDataset.js (Indonesian & Western Nutritional Database)

---

## 2. Mathematical Baselines

### 2.1. Basal Metabolic Rate (BMR) - Mifflin-St Jeor Equation
Calculated from verified biometric inputs (weight in kg, height in cm, age in years):

BMR (Male) = (10 x Weight) + (6.25 x Height) - (5 x Age) + 5  
BMR (Female) = (10 x Weight) + (6.25 x Height) - (5 x Age) - 161  

### 2.2. Total Daily Energy Expenditure (TDEE)
TDEE = BMR x Activity Multiplier  

Activity Multipliers:
- Sedentary: 1.20
- Light Training (1-3 days/week): 1.375
- Moderate Training (3-5 days/week): 1.55 (GymVault Active Athlete Default)
- Heavy Training (6-7 days/week): 1.725
- Competitive Athlete (2x/day): 1.90

### 2.3. Goal-Oriented Calorie Targets
- Fat Loss (Cut): TDEE - 500 kcal (Targets 0.5kg fat loss per week while preserving lean mass)
- Muscle Gain (Clean Bulk): TDEE + 400 kcal (Maximizes muscle protein synthesis while minimizing adipose gain)
- Maintenance: TDEE exact

---

## 3. Macronutrient & Hydration Distribution

GymVault enforces evidence-based sports nutrition ratios:

1. Protein Target
- Ratio: 2.2 grams per kilogram of bodyweight.
- Caloric Value: 4 kcal per gram.
- Example: 70kg athlete = 154g protein (616 kcal).

2. Healthy Fats Target
- Ratio: 25% of total target daily calories.
- Caloric Value: 9 kcal per gram.
- Example: 2000 kcal target = 500 kcal from fats = 55g fat.

3. Carbohydrates Target
- Ratio: All remaining calories allocated to glycogen replenishment.
- Formula: (Target Calories - Protein Calories - Fat Calories) / 4.
- Example: (2000 - 616 - 500) / 4 = 221g carbohydrates.

4. Daily Hydration Standard
- Formula: 40 milliliters per kilogram of bodyweight.
- Example: 70kg athlete = 2.8 Liters baseline water intake.
- Workout Day Bonus: +500ml per hour of high-intensity barbell training.

---

## 4. Vision AI Food Scanner Architecture

When an athlete captures a meal photo via NutritionScannerModal:
1. Image is compressed to WebP/JPEG (maximum 800px dimension) to minimize payload latency.
2. System triggers Google Gemini 3.7 Vision cascade.
3. Strict JSON output formatting is enforced via system role prompting:
   - food_name: Name of detected meal
   - calories: Estimated kcal
   - protein: Protein in grams
   - carbs: Carbs in grams
   - fats: Fats in grams
   - confidence_score: Reliability score (0.0 to 1.0)
4. If confidence is low or API is offline, user is prompted with an editable pre-filled modal to adjust gram portions manually.
5. Saved meals insert to nutrition_logs table and update local AsyncStorage cache instantly.
