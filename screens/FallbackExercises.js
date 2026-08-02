const BASE_EXERCISES = [
  // --- CHEST ---
  {
    id: "fb-chest-1",
    name: "Barbell Bench Press",
    equipment_type: "Barbell",
    muscle_group: "Chest",
    level: "Intermediate",
    thumbnail_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=150&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop"],
    instructions: "Lie flat on a bench. Grip the barbell slightly wider than shoulder-width. Lower the bar slowly to your chest, then press it back up explosively."
  },
  {
    id: "fb-chest-2",
    name: "Dumbbell Bench Press",
    equipment_type: "Dumbbells",
    muscle_group: "Chest",
    level: "Intermediate",
    thumbnail_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=150&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop"],
    instructions: "Lie on a flat bench holding dumbbells at chest level. Press them straight up until your arms are fully extended, then lower them under control."
  },
  {
    id: "fb-chest-3",
    name: "Incline Barbell Bench Press",
    equipment_type: "Barbell",
    muscle_group: "Chest",
    level: "Intermediate",
    thumbnail_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=150&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop"],
    instructions: "Lie on an incline bench (about 30-45 degrees). Lower the barbell to your upper chest, then press it back up to the starting position."
  },
  {
    id: "fb-chest-4",
    name: "Incline Dumbbell Press",
    equipment_type: "Dumbbells",
    muscle_group: "Chest",
    level: "Intermediate",
    instructions: "Sit on an incline bench with dumbbells. Press the weights up over your upper chest, keeping your elbows slightly tucked."
  },
  {
    id: "fb-chest-5",
    name: "Decline Barbell Bench Press",
    equipment_type: "Barbell",
    muscle_group: "Chest",
    level: "Intermediate",
    instructions: "Lie on a decline bench. Lower the barbell to your lower chest, then press it up, focusing on the lower pectoral fibers."
  },
  {
    id: "fb-chest-6",
    name: "Push-Ups",
    equipment_type: "Bodyweight",
    muscle_group: "Chest",
    level: "Beginner",
    instructions: "Place hands shoulder-width apart on the floor. Keep your body in a straight plank. Lower your chest to the floor, then push back up."
  },
  {
    id: "fb-chest-7",
    name: "Dumbbell Chest Fly",
    equipment_type: "Dumbbells",
    muscle_group: "Chest",
    level: "Intermediate",
    instructions: "Lie flat on a bench with dumbbells. Open your arms wide in a slight arc, feeling a stretch in your chest, then squeeze them back together."
  },
  {
    id: "fb-chest-8",
    name: "Cable Crossover",
    equipment_type: "Cable",
    muscle_group: "Chest",
    level: "Intermediate",
    instructions: "Stand between two pulleys. Grab the handles and bring your hands together in front of your body with a slight bend in your elbows."
  },
  {
    id: "fb-chest-9",
    name: "Pec Deck Fly",
    equipment_type: "Machine",
    muscle_group: "Chest",
    level: "Beginner",
    instructions: "Sit at the fly machine. Squeeze the handles or pads together in front of your chest, keeping a proud posture."
  },
  {
    id: "fb-chest-10",
    name: "Chest Dips",
    equipment_type: "Bodyweight",
    muscle_group: "Chest",
    level: "Expert",
    instructions: "Support yourself on dip bars. Lean your torso slightly forward, flare elbows slightly out, and lower yourself until chest is stretched, then press up."
  },

  // --- BACK ---
  {
    id: "fb-back-1",
    name: "Pull-Ups",
    equipment_type: "Bodyweight",
    muscle_group: "Back",
    level: "Intermediate",
    instructions: "Hang from a pull-up bar with an overhand grip. Pull your chest up to the bar, engaging your lats and squeezing your shoulder blades."
  },
  {
    id: "fb-back-2",
    name: "Chin-Ups",
    equipment_type: "Bodyweight",
    muscle_group: "Back",
    level: "Beginner",
    instructions: "Hang from a bar with an underhand grip. Pull your body up until your chin clears the bar, focusing on both lats and biceps."
  },
  {
    id: "fb-back-3",
    name: "Lat Pulldown (Cable)",
    equipment_type: "Cable",
    muscle_group: "Back",
    level: "Beginner",
    instructions: "Sit at a pulldown machine. Grab the bar wide, lean back slightly, and pull the bar down to your upper chest while squeezing your lats."
  },
  {
    id: "fb-back-4",
    name: "Barbell Bent-Over Row",
    equipment_type: "Barbell",
    muscle_group: "Back",
    level: "Intermediate",
    instructions: "Hinge at the hips with a straight back. Pull the barbell toward your lower stomach, keeping elbows close to your torso."
  },
  {
    id: "fb-back-5",
    name: "One-Arm Dumbbell Row",
    equipment_type: "Dumbbells",
    muscle_group: "Back",
    level: "Beginner",
    instructions: "Place one knee and hand on a bench. Row a dumbbell up to your hip with the opposite arm, keeping your back flat."
  },
  {
    id: "fb-back-6",
    name: "Seated Cable Row",
    equipment_type: "Cable",
    muscle_group: "Back",
    level: "Beginner",
    instructions: "Sit at a cable row machine. Pull the attachment to your lower chest, retracting your shoulder blades and keeping your spine neutral."
  },
  {
    id: "fb-back-7",
    name: "T-Bar Row",
    equipment_type: "Barbell",
    muscle_group: "Back",
    level: "Intermediate",
    instructions: "Straddle the barbell/T-bar machine. Pull the weight towards your chest, keeping your chest open and lower back arched safely."
  },
  {
    id: "fb-back-8",
    name: "Deadlift (Barbell)",
    equipment_type: "Barbell",
    muscle_group: "Back",
    level: "Intermediate",
    instructions: "Stand with midfoot under the barbell. Bend and grab the bar. Push through your legs, stand tall with chest out, then hinge to lower it."
  },
  {
    id: "fb-back-9",
    name: "Face Pulls",
    equipment_type: "Cable",
    muscle_group: "Back",
    level: "Beginner",
    instructions: "Set pulley at upper chest height. Pull the rope towards your face, pulling hands apart and rotating shoulders externally at the finish."
  },
  {
    id: "fb-back-10",
    name: "Hyperextensions",
    equipment_type: "Bodyweight",
    muscle_group: "Back",
    level: "Beginner",
    instructions: "Position yourself on a hyperextension bench. Lower your torso, then lift it back up using your glutes, hamstrings, and lower back."
  },

  // --- SHOULDERS ---
  {
    id: "fb-shoulder-1",
    name: "Overhead Press (Barbell)",
    equipment_type: "Barbell",
    muscle_group: "Shoulders",
    level: "Intermediate",
    instructions: "Stand holding a barbell at shoulder level. Press the bar straight up overhead, locking your elbows and pushing your head forward slightly."
  },
  {
    id: "fb-shoulder-2",
    name: "Dumbbell Shoulder Press",
    equipment_type: "Dumbbells",
    muscle_group: "Shoulders",
    level: "Intermediate",
    instructions: "Sit or stand holding dumbbells at shoulder level. Press the weights straight up overhead until arms are locked, then lower slowly."
  },
  {
    id: "fb-shoulder-3",
    name: "Arnold Press",
    equipment_type: "Dumbbells",
    muscle_group: "Shoulders",
    level: "Intermediate",
    instructions: "Start with dumbbells in front of shoulders, palms facing you. Press up while rotating palms to face forward at the top."
  },
  {
    id: "fb-shoulder-4",
    name: "Dumbbell Lateral Raise",
    equipment_type: "Dumbbells",
    muscle_group: "Shoulders",
    level: "Beginner",
    instructions: "Stand holding dumbbells at your sides. Raise arms out to the sides with a slight bend in your elbows until parallel to the floor."
  },
  {
    id: "fb-shoulder-5",
    name: "Cable Lateral Raise",
    equipment_type: "Cable",
    muscle_group: "Shoulders",
    level: "Intermediate",
    instructions: "Stand beside a low pulley. Pull the cable across your body and up to shoulder height, maintaining constant tension on the side deltoids."
  },
  {
    id: "fb-shoulder-6",
    name: "Dumbbell Front Raise",
    equipment_type: "Dumbbells",
    muscle_group: "Shoulders",
    level: "Beginner",
    instructions: "Stand holding dumbbells. Lift the weights straight forward in front of you to shoulder level, then lower under control."
  },
  {
    id: "fb-shoulder-7",
    name: "Rear Delt Dumbbell Fly",
    equipment_type: "Dumbbells",
    muscle_group: "Shoulders",
    level: "Beginner",
    instructions: "Hinge forward at the hips. Raise dumbbells out to the sides, squeezing your rear delts and shoulder blades together."
  },
  {
    id: "fb-shoulder-8",
    name: "Barbell Upright Row",
    equipment_type: "Barbell",
    muscle_group: "Shoulders",
    level: "Intermediate",
    instructions: "Pull a barbell straight up to your chest, keeping the bar close to your body and raising elbows high."
  },
  {
    id: "fb-shoulder-9",
    name: "Barbell Shrugs",
    equipment_type: "Barbell",
    muscle_group: "Shoulders",
    level: "Beginner",
    instructions: "Stand holding a barbell. Shrug your shoulders straight up toward your ears, squeeze the traps, and lower slowly."
  },

  // --- ARMS (BICEPS / TRICEPS) ---
  {
    id: "fb-arms-1",
    name: "Barbell Bicep Curl",
    equipment_type: "Barbell",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Stand holding a barbell with underhand grip. Curl the bar up toward your shoulders, keeping elbows locked at your sides."
  },
  {
    id: "fb-arms-2",
    name: "Dumbbell Bicep Curl",
    equipment_type: "Dumbbells",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Stand holding dumbbells. Curl the weights up while rotating your palms upward, squeezing the biceps at the top."
  },
  {
    id: "fb-arms-3",
    name: "Dumbbell Hammer Curl",
    equipment_type: "Dumbbells",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Stand holding dumbbells with palms facing each other (neutral grip). Curl up, targeting the brachialis and forearm muscles."
  },
  {
    id: "fb-arms-4",
    name: "Preacher Curl",
    equipment_type: "Barbell",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Rest your upper arms on a preacher bench. Curl the barbell or EZ bar up to isolate the biceps completely."
  },
  {
    id: "fb-arms-5",
    name: "Cable Bicep Curl",
    equipment_type: "Cable",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Attach a bar to a low pulley. Curl the bar up under constant cable tension."
  },
  {
    id: "fb-arms-6",
    name: "Triceps Cable Pushdown",
    equipment_type: "Cable",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Stand in front of a high pulley. Press the rope or bar down, fully extending your elbows and squeezing your triceps."
  },
  {
    id: "fb-arms-7",
    name: "Lying Tricep Extension (Skull Crusher)",
    equipment_type: "Barbell",
    muscle_group: "Arms",
    level: "Intermediate",
    instructions: "Lie flat on a bench holding an EZ bar. Lower the bar to your forehead by bending at the elbows, then press back up."
  },
  {
    id: "fb-arms-8",
    name: "Overhead Dumbbell Tricep Extension",
    equipment_type: "Dumbbells",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Hold a dumbbell with both hands overhead. Lower it behind your neck, then press it straight back up."
  },
  {
    id: "fb-arms-9",
    name: "Tricep Bench Dips",
    equipment_type: "Bodyweight",
    muscle_group: "Arms",
    level: "Beginner",
    instructions: "Place hands on the edge of a bench behind you. Lower your hips by bending elbows to 90 degrees, then push up."
  },
  {
    id: "fb-arms-10",
    name: "Close-Grip Bench Press",
    equipment_type: "Barbell",
    muscle_group: "Arms",
    level: "Intermediate",
    instructions: "Lie flat on a bench. Grip the barbell with hands shoulder-width apart. Lower to chest and press up, targeting triceps."
  },

  // --- QUADS ---
  {
    id: "fb-quads-1",
    name: "Barbell Back Squat",
    equipment_type: "Barbell",
    muscle_group: "Quads",
    level: "Intermediate",
    instructions: "Place barbell on your upper back. Squat down by pushing hips back and bending knees until thighs are parallel to floor, then stand up."
  },
  {
    id: "fb-quads-2",
    name: "Goblet Squat (Dumbbell)",
    equipment_type: "Dumbbells",
    muscle_group: "Quads",
    level: "Beginner",
    instructions: "Hold a dumbbell or kettlebell vertically against your chest. Perform a deep squat, keeping your torso upright."
  },
  {
    id: "fb-quads-3",
    name: "Leg Press",
    equipment_type: "Machine",
    muscle_group: "Quads",
    level: "Beginner",
    instructions: "Sit in the leg press machine. Place feet shoulder-width apart on sled, unlock it, lower it toward chest, then press back up."
  },
  {
    id: "fb-quads-4",
    name: "Leg Extension",
    equipment_type: "Machine",
    muscle_group: "Quads",
    level: "Beginner",
    instructions: "Sit at the extension machine. Extend your legs straight out, squeezing your quadriceps at the top of the movement."
  },
  {
    id: "fb-quads-5",
    name: "Dumbbell Lunges",
    equipment_type: "Dumbbells",
    muscle_group: "Quads",
    level: "Beginner",
    instructions: "Hold dumbbells at your sides. Take a large step forward, bending both knees until back knee is just above floor, then step back."
  },
  {
    id: "fb-quads-6",
    name: "Bulgarian Split Squat",
    equipment_type: "Dumbbells",
    muscle_group: "Quads",
    level: "Intermediate",
    instructions: "Place one foot behind you on a bench. Hold dumbbells and squat down on your front leg until thigh is parallel to floor."
  },
  {
    id: "fb-quads-7",
    name: "Hack Squat Machine",
    equipment_type: "Machine",
    muscle_group: "Quads",
    level: "Intermediate",
    instructions: "Place shoulders under pads on hack squat machine. Lower sled by bending knees, then press up to target outer quads."
  },

  // --- HAMSTRINGS / GLUTES ---
  {
    id: "fb-hams-1",
    name: "Romanian Deadlift (Barbell)",
    equipment_type: "Barbell",
    muscle_group: "Hamstrings",
    level: "Intermediate",
    instructions: "Hold barbell at hips. Push hips back, sliding the bar down your legs while keeping back straight until you feel a hamstring stretch."
  },
  {
    id: "fb-hams-2",
    name: "Dumbbell Romanian Deadlift",
    equipment_type: "Dumbbells",
    muscle_group: "Hamstrings",
    level: "Beginner",
    instructions: "Perform a Romanian deadlift holding dumbbells close to your shins, pushing hips far back."
  },
  {
    id: "fb-hams-3",
    name: "Lying Leg Curl",
    equipment_type: "Machine",
    muscle_group: "Hamstrings",
    level: "Beginner",
    instructions: "Lie face down on the leg curl machine. Curl the roller pad toward your glutes, keeping hips pressed flat."
  },
  {
    id: "fb-hams-4",
    name: "Seated Leg Curl",
    equipment_type: "Machine",
    muscle_group: "Hamstrings",
    level: "Beginner",
    instructions: "Sit in the leg curl machine. Squeeze pad down behind your calves, isolating hamstrings."
  },
  {
    id: "fb-hams-5",
    name: "Barbell Hip Thrust",
    equipment_type: "Barbell",
    muscle_group: "Hamstrings",
    level: "Intermediate",
    instructions: "Sit with upper back against a bench, bar on hips. Drive hips up, squeezing glutes hard at the top with knees at 90 degrees."
  },
  {
    id: "fb-hams-6",
    name: "Standing Calf Raise",
    equipment_type: "Machine",
    muscle_group: "Hamstrings",
    level: "Beginner",
    instructions: "Place shoulders under pads. Raise heels as high as possible, contract calves, and lower below the platform level."
  },

  // --- CORE / ABS ---
  {
    id: "fb-core-1",
    name: "Plank",
    equipment_type: "Bodyweight",
    muscle_group: "Core",
    level: "Beginner",
    instructions: "Hold your body in a straight line supported by forearms and toes. Keep core tight and avoid sagging hips."
  },
  {
    id: "fb-core-2",
    name: "Ab Crunch",
    equipment_type: "Bodyweight",
    muscle_group: "Core",
    level: "Beginner",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/2/29/Sit-ups_or_Crunch.gif",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/29/Sit-ups_or_Crunch.gif"],
    instructions: "Lie on back with knees bent. Contract abs to lift shoulder blades off the floor, keeping lower back pressed down."
  },
  {
    id: "fb-core-3",
    name: "Lying Leg Raises",
    equipment_type: "Bodyweight",
    muscle_group: "Core",
    level: "Beginner",
    instructions: "Lie on your back with legs straight. Raise legs straight up to 90 degrees, then lower them slowly without touching floor."
  },
  {
    id: "fb-core-4",
    name: "Hanging Knee Raise",
    equipment_type: "Bodyweight",
    muscle_group: "Core",
    level: "Intermediate",
    instructions: "Hang from a pull-up bar. Lift knees toward your chest, curling your pelvis up to engage the lower abs."
  },
  {
    id: "fb-core-5",
    name: "Russian Twist",
    equipment_type: "Bodyweight",
    muscle_group: "Core",
    level: "Beginner",
    instructions: "Sit with knees bent, feet slightly off floor. Twist your torso side-to-side, tapping hands on floor."
  },
  {
    id: "fb-core-6",
    name: "Cable Woodchopper",
    equipment_type: "Cable",
    muscle_group: "Core",
    level: "Intermediate",
    instructions: "Grab cable handle. Pull diagonally down across your body, twisting torso and hips to target obliques."
  }
];

export const FALLBACK_EXERCISES = [...BASE_EXERCISES];

