/**
 * Extended GymVault Nutrition Dataset (Derived from Kaggle & USDA Databases)
 * Contains 110+ highly precise entries for fitness foods, common international foods, 
 * local Indonesian dishes, snacks, and beverages to prevent AI calculation errors or hallucinations.
 */

export const NUTRITION_DATASET = [
  // --- PROTEINS (MEATS, SEAFOOD & VEGAN PROTEINS) ---
  {
    name: "Dada Ayam (Chicken Breast)",
    keywords: ["dada ayam", "chicken breast", "chicken breast raw", "chicken breast cooked", "dada ayam rebus", "dada ayam panggang", "dada ayam bakar"],
    cal: 165, p: 31.0, c: 0.0, f: 3.6,
    unit: "100g"
  },
  {
    name: "Paha Ayam (Chicken Thigh)",
    keywords: ["paha ayam", "chicken thigh", "paha ayam goreng", "paha ayam bakar", "paha ayam rebus"],
    cal: 209, p: 26.0, c: 0.0, f: 11.0,
    unit: "100g"
  },
  {
    name: "Ayam Goreng (Fried Chicken)",
    keywords: ["ayam goreng", "fried chicken", "kentucky fried chicken", "kfc", "mcd chicken", "ayam krispi"],
    cal: 246, p: 25.0, c: 8.0, f: 12.0,
    unit: "100g"
  },
  {
    name: "Daging Sapi (Beef Sirloin)",
    keywords: ["daging sapi", "beef", "sirloin", "tenderloin", "daging sapi bakar", "steak", "daging sapi panggang"],
    cal: 244, p: 27.0, c: 0.0, f: 15.0,
    unit: "100g"
  },
  {
    name: "Daging Sapi Cincang (Ground Beef)",
    keywords: ["daging sapi cincang", "ground beef", "minced beef"],
    cal: 250, p: 26.0, c: 0.0, f: 15.0,
    unit: "100g"
  },
  {
    name: "Daging Bebek (Duck Meat)",
    keywords: ["daging bebek", "bebek", "bebek goreng", "bebek bakar", "duck"],
    cal: 337, p: 19.0, c: 0.0, f: 28.0,
    unit: "100g"
  },
  {
    name: "Daging Domba (Lamb)",
    keywords: ["daging domba", "lamb", "mutton", "daging kambing"],
    cal: 294, p: 25.0, c: 0.0, f: 21.0,
    unit: "100g"
  },
  {
    name: "Telur Rebus (Boiled Egg)",
    keywords: ["telur rebus", "boiled egg", "egg boiled", "telor rebus"],
    cal: 78, p: 6.3, c: 0.6, f: 5.3,
    unit: "1 piece (approx. 50g)"
  },
  {
    name: "Telur Goreng (Fried Egg)",
    keywords: ["telur goreng", "fried egg", "telur mata sapi", "telur dadar", "telor goreng", "ceplok"],
    cal: 90, p: 6.3, c: 0.4, f: 7.0,
    unit: "1 piece (approx. 50g)"
  },
  {
    name: "Salmon Panggang (Grilled Salmon)",
    keywords: ["salmon", "grilled salmon", "salmon panggang", "salmon bakar"],
    cal: 206, p: 22.0, c: 0.0, f: 12.0,
    unit: "100g"
  },
  {
    name: "Ikan Tuna (Tuna in Water)",
    keywords: ["tuna", "ikan tuna", "tuna kaleng", "tuna in water"],
    cal: 116, p: 26.0, c: 0.0, f: 1.0,
    unit: "100g"
  },
  {
    name: "Ikan Lele Goreng (Fried Catfish)",
    keywords: ["ikan lele", "lele goreng", "pecel lele", "lele"],
    cal: 200, p: 18.0, c: 0.0, f: 13.0,
    unit: "100g"
  },
  {
    name: "Ikan Kakap (Snapper)",
    keywords: ["ikan kakap", "snapper", "kakap merah", "kakap bakar"],
    cal: 128, p: 26.0, c: 0.0, f: 2.0,
    unit: "100g"
  },
  {
    name: "Ikan Gurame Bakar",
    keywords: ["gurame bakar", "ikan gurame", "gurami bakar", "gurame goreng"],
    cal: 190, p: 18.0, c: 3.0, f: 11.0,
    unit: "100g"
  },
  {
    name: "Ikan Mas Goreng",
    keywords: ["ikan mas", "ikan mas goreng"],
    cal: 220, p: 17.0, c: 0.0, f: 15.0,
    unit: "100g"
  },
  {
    name: "Udang Rebus (Boiled Shrimp)",
    keywords: ["udang", "shrimp", "prawn", "udang rebus"],
    cal: 99, p: 24.0, c: 0.2, f: 0.3,
    unit: "100g"
  },
  {
    name: "Kepiting (Crab)",
    keywords: ["kepiting", "crab", "daging kepiting"],
    cal: 83, p: 18.0, c: 0.0, f: 1.0,
    unit: "100g"
  },
  {
    name: "Kerang (Clams)",
    keywords: ["kerang", "clams", "kerang rebus"],
    cal: 74, p: 12.0, c: 2.6, f: 1.0,
    unit: "100g"
  },
  {
    name: "Dada Kalkun (Turkey Breast)",
    keywords: ["turkey breast", "kalkun", "dada kalkun"],
    cal: 135, p: 30.0, c: 0.0, f: 1.0,
    unit: "100g"
  },
  {
    name: "Whey Protein (1 Scoop)",
    keywords: ["whey protein", "whey", "protein powder", "optimum nutrition", "iso surge", "evolene", "suplemen protein"],
    cal: 120, p: 25.0, c: 3.0, f: 1.5,
    unit: "1 scoop (30g)"
  },
  {
    name: "Casein Protein (1 Scoop)",
    keywords: ["casein", "casein protein"],
    cal: 110, p: 24.0, c: 1.0, f: 1.0,
    unit: "1 scoop (30g)"
  },
  {
    name: "Protein Bar",
    keywords: ["protein bar", "l-men bar", "fitbar"],
    cal: 200, p: 20.0, c: 18.0, f: 6.0,
    unit: "1 bar (60g)"
  },
  {
    name: "Tempe Goreng (Fried Tempeh)",
    keywords: ["tempe goreng", "fried tempeh", "tempe"],
    cal: 328, p: 20.0, c: 16.0, f: 22.0,
    unit: "100g"
  },
  {
    name: "Tahu Goreng (Fried Tofu)",
    keywords: ["tahu goreng", "fried tofu", "tahu"],
    cal: 271, p: 17.0, c: 10.0, f: 20.0,
    unit: "100g"
  },
  {
    name: "Tempe Bacem",
    keywords: ["tempe bacem"],
    cal: 190, p: 11.0, c: 22.0, f: 7.0,
    unit: "100g"
  },
  {
    name: "Tahu Bacem",
    keywords: ["tahu bacem"],
    cal: 160, p: 10.0, c: 18.0, f: 6.0,
    unit: "100g"
  },

  // --- CARBS & GRAINS ---
  {
    name: "Nasi Putih (White Rice)",
    keywords: ["nasi putih", "white rice", "nasi", "cooked rice", "nasi beras putih"],
    cal: 130, p: 2.7, c: 28.0, f: 0.3,
    unit: "100g"
  },
  {
    name: "Nasi Merah (Brown Rice)",
    keywords: ["nasi merah", "brown rice", "nasi beras merah"],
    cal: 111, p: 2.6, c: 23.0, f: 0.9,
    unit: "100g"
  },
  {
    name: "Oatmeal (Rolled Oats)",
    keywords: ["oatmeal", "oats", "quaker oats", "havermut"],
    cal: 389, p: 16.9, c: 66.3, f: 6.9,
    unit: "100g (dry)"
  },
  {
    name: "Kentang Rebus (Boiled Potato)",
    keywords: ["kentang rebus", "boiled potato", "kentang", "potato"],
    cal: 87, p: 1.9, c: 20.1, f: 0.1,
    unit: "100g"
  },
  {
    name: "Kentang Goreng (French Fries)",
    keywords: ["french fries", "kentang goreng", "fries"],
    cal: 312, p: 3.4, c: 41.0, f: 15.0,
    unit: "100g"
  },
  {
    name: "Ubi Jalar Rebus (Boiled Sweet Potato)",
    keywords: ["ubi jalar", "sweet potato", "ubi rebus"],
    cal: 86, p: 1.6, c: 20.0, f: 0.1,
    unit: "100g"
  },
  {
    name: "Roti Tawar Putih",
    keywords: ["roti tawar", "white bread", "roti tawar putih"],
    cal: 75, p: 2.5, c: 14.0, f: 1.0,
    unit: "1 slice (28g)"
  },
  {
    name: "Roti Gandum (Whole Wheat Bread)",
    keywords: ["roti gandum", "whole wheat bread", "wheat bread"],
    cal: 69, p: 3.6, c: 12.0, f: 1.0,
    unit: "1 slice (28g)"
  },
  {
    name: "Singkong Rebus (Boiled Cassava)",
    keywords: ["singkong rebus", "singkong", "cassava"],
    cal: 160, p: 1.4, c: 38.0, f: 0.3,
    unit: "100g"
  },
  {
    name: "Pasta Spaghetti / Macaroni",
    keywords: ["pasta", "spaghetti", "macaroni", "spageti", "makaroni"],
    cal: 158, p: 5.8, c: 31.0, f: 0.9,
    unit: "100g (cooked)"
  },
  {
    name: "Quinoa Cooked",
    keywords: ["quinoa", "kinoa"],
    cal: 120, p: 4.4, c: 21.3, f: 1.9,
    unit: "100g"
  },
  {
    name: "Jagung Rebus (Boiled Corn)",
    keywords: ["jagung", "corn", "jagung rebus"],
    cal: 96, p: 3.4, c: 21.0, f: 1.5,
    unit: "100g"
  },
  {
    name: "Granola",
    keywords: ["granola"],
    cal: 471, p: 10.0, c: 64.0, f: 20.0,
    unit: "100g"
  },

  // --- SEEDS, NUTS & FATS ---
  {
    name: "Selai Kacang (Peanut Butter)",
    keywords: ["selai kacang", "peanut butter", "skippy"],
    cal: 188, p: 8.0, c: 6.0, f: 16.0,
    unit: "2 tbsp (32g)"
  },
  {
    name: "Kacang Almond (Almonds)",
    keywords: ["almond", "almonds", "kacang almond"],
    cal: 164, p: 6.0, c: 6.0, f: 14.0,
    unit: "1 oz (28g)"
  },
  {
    name: "Kacang Tanah (Peanuts)",
    keywords: ["kacang", "peanuts", "kacang tanah"],
    cal: 161, p: 7.0, c: 4.5, f: 14.0,
    unit: "1 oz (28g)"
  },
  {
    name: "Kacang Mede (Cashews)",
    keywords: ["kacang mede", "kacang mete", "cashews"],
    cal: 157, p: 5.0, c: 9.0, f: 12.0,
    unit: "1 oz (28g)"
  },
  {
    name: "Chia Seeds",
    keywords: ["chia", "chia seeds"],
    cal: 138, p: 4.7, c: 12.0, f: 8.7,
    unit: "1 oz (28g)"
  },
  {
    name: "Mentega (Butter)",
    keywords: ["mentega", "butter", "blue band"],
    cal: 717, p: 0.9, c: 0.1, f: 81.0,
    unit: "100g"
  },

  // --- DAIRY & PRODUCTS ---
  {
    name: "Susu Sapi Full Cream (Whole Milk)",
    keywords: ["susu sapi", "milk", "whole milk", "susu full cream", "ultramilk"],
    cal: 150, p: 8.0, c: 12.0, f: 8.0,
    unit: "1 glass (240ml)"
  },
  {
    name: "Susu Low Fat (Low Fat Milk)",
    keywords: ["susu low fat", "low fat milk", "susu diet"],
    cal: 100, p: 8.0, c: 12.0, f: 2.5,
    unit: "1 glass (240ml)"
  },
  {
    name: "Susu Kedelai (Soy Milk)",
    keywords: ["susu kedelai", "soy milk", "soyamilk"],
    cal: 54, p: 3.3, c: 6.0, f: 1.8,
    unit: "100ml"
  },
  {
    name: "Susu Almond Unsweetened",
    keywords: ["susu almond", "almond milk"],
    cal: 15, p: 0.5, c: 0.3, f: 1.1,
    unit: "100ml"
  },
  {
    name: "Susu Gandum (Oat Milk)",
    keywords: ["oat milk", "susu oat", "oatside"],
    cal: 50, p: 1.0, c: 7.0, f: 1.5,
    unit: "100ml"
  },
  {
    name: "Greek Yogurt Plain (Non-Fat)",
    keywords: ["greek yogurt", "yogurt", "yogurt plain"],
    cal: 59, p: 10.0, c: 3.6, f: 0.4,
    unit: "100g"
  },
  {
    name: "Keju Cheddar (Cheddar Cheese)",
    keywords: ["keju", "cheese", "keju cheddar", "cheddar"],
    cal: 113, p: 7.0, c: 0.4, f: 9.3,
    unit: "1 slice (28g)"
  },
  {
    name: "Keju Mozzarella",
    keywords: ["mozzarella", "keju mozzarella"],
    cal: 280, p: 22.0, c: 2.2, f: 20.0,
    unit: "100g"
  },
  {
    name: "Keju Cottage (Cottage Cheese)",
    keywords: ["cottage cheese", "keju cottage"],
    cal: 98, p: 11.0, c: 3.4, f: 4.3,
    unit: "100g"
  },

  // --- FRUITS & VEGETABLES ---
  {
    name: "Pisang (Banana)",
    keywords: ["pisang", "banana", "banana raw"],
    cal: 105, p: 1.3, c: 27.0, f: 0.4,
    unit: "1 medium piece (118g)"
  },
  {
    name: "Apel (Apple)",
    keywords: ["apel", "apple"],
    cal: 95, p: 0.5, c: 25.0, f: 0.3,
    unit: "1 medium piece (182g)"
  },
  {
    name: "Alpukat (Avocado)",
    keywords: ["alpukat", "avocado"],
    cal: 160, p: 2.0, c: 8.5, f: 14.7,
    unit: "100g"
  },
  {
    name: "Jeruk (Orange)",
    keywords: ["jeruk", "orange"],
    cal: 62, p: 1.2, c: 15.4, f: 0.2,
    unit: "1 medium piece (131g)"
  },
  {
    name: "Semangka (Watermelon)",
    keywords: ["semangka", "watermelon"],
    cal: 30, p: 0.6, c: 7.6, f: 0.2,
    unit: "100g"
  },
  {
    name: "Mangga (Mango)",
    keywords: ["mangga", "mango", "mempelam"],
    cal: 60, p: 0.8, c: 15.0, f: 0.4,
    unit: "100g"
  },
  {
    name: "Pepaya (Papaya)",
    keywords: ["pepaya", "papaya"],
    cal: 43, p: 0.5, c: 11.0, f: 0.3,
    unit: "100g"
  },
  {
    name: "Stroberi (Strawberry)",
    keywords: ["stroberi", "strawberry", "strawberry raw"],
    cal: 32, p: 0.7, c: 7.7, f: 0.3,
    unit: "100g"
  },
  {
    name: "Blueberry",
    keywords: ["blueberry", "blueberries"],
    cal: 57, p: 0.7, c: 14.0, f: 0.3,
    unit: "100g"
  },
  {
    name: "Brokoli Rebus (Boiled Broccoli)",
    keywords: ["brokoli", "broccoli", "brokoli rebus"],
    cal: 35, p: 2.4, c: 7.0, f: 0.4,
    unit: "100g"
  },
  {
    name: "Bayam (Spinach)",
    keywords: ["bayam", "spinach", "sayur bayam"],
    cal: 23, p: 2.9, c: 3.6, f: 0.4,
    unit: "100g"
  },
  {
    name: "Wortel (Carrot)",
    keywords: ["wortel", "carrot"],
    cal: 41, p: 0.9, c: 9.6, f: 0.2,
    unit: "100g"
  },
  {
    name: "Kol / Kubis (Cabbage)",
    keywords: ["kol", "kubis", "cabbage"],
    cal: 25, p: 1.3, c: 5.8, f: 0.1,
    unit: "100g"
  },
  {
    name: "Kembang Kol (Cauliflower)",
    keywords: ["kembang kol", "cauliflower"],
    cal: 25, p: 1.9, c: 5.0, f: 0.3,
    unit: "100g"
  },
  {
    name: "Tomat (Tomato)",
    keywords: ["tomat", "tomato"],
    cal: 18, p: 0.9, c: 3.9, f: 0.2,
    unit: "100g"
  },
  {
    name: "Timun (Cucumber)",
    keywords: ["timun", "cucumber", "mentimun"],
    cal: 15, p: 0.6, c: 3.6, f: 0.1,
    unit: "100g"
  },

  // --- LOCAL FAVORITES / INDONESIAN DISHES ---
  {
    name: "Rendang Sapi",
    keywords: ["rendang", "rendang sapi", "beef rendang"],
    cal: 195, p: 18.0, c: 6.0, f: 11.0,
    unit: "100g"
  },
  {
    name: "Sate Ayam Madura (10 Tusuk)",
    keywords: ["sate ayam", "sate madura", "sate", "chicken satay"],
    cal: 350, p: 32.0, c: 15.0, f: 18.0,
    unit: "1 portion (10 skewers with peanut sauce)"
  },
  {
    name: "Sate Kambing (10 Tusuk)",
    keywords: ["sate kambing", "kambing"],
    cal: 380, p: 36.0, c: 10.0, f: 20.0,
    unit: "1 portion (10 skewers)"
  },
  {
    name: "Bakso Sapi (Lengkap)",
    keywords: ["bakso", "bakso sapi", "meatball soup"],
    cal: 320, p: 16.0, c: 35.0, f: 12.0,
    unit: "1 bowl"
  },
  {
    name: "Mie Ayam",
    keywords: ["mie ayam", "mi ayam", "chicken noodle"],
    cal: 450, p: 18.0, c: 58.0, f: 16.0,
    unit: "1 bowl"
  },
  {
    name: "Soto Ayam",
    keywords: ["soto ayam", "soto"],
    cal: 180, p: 12.0, c: 15.0, f: 8.0,
    unit: "1 bowl"
  },
  {
    name: "Soto Betawi",
    keywords: ["soto betawi"],
    cal: 310, p: 15.0, c: 12.0, f: 22.0,
    unit: "1 bowl"
  },
  {
    name: "Soto Kudus",
    keywords: ["soto kudus"],
    cal: 150, p: 10.0, c: 12.0, f: 6.0,
    unit: "1 bowl"
  },
  {
    name: "Gado-Gado",
    keywords: ["gado gado", "gado-gado"],
    cal: 350, p: 12.0, c: 38.0, f: 18.0,
    unit: "1 portion"
  },
  {
    name: "Pempek Palembang (Porsi)",
    keywords: ["pempek", "empek empek", "pempek selam", "pempek lenjer"],
    cal: 280, p: 10.0, c: 42.0, f: 8.0,
    unit: "1 portion (approx 3 small/medium pieces)"
  },
  {
    name: "Indomie Goreng",
    keywords: ["indomie", "indomie goreng", "instant noodles", "mie instan"],
    cal: 380, p: 8.0, c: 54.0, f: 14.0,
    unit: "1 pack (85g)"
  },
  {
    name: "Bubur Ayam",
    keywords: ["bubur", "bubur ayam", "chicken porridge"],
    cal: 290, p: 12.0, c: 40.0, f: 8.0,
    unit: "1 bowl"
  },
  {
    name: "Opor Ayam",
    keywords: ["opor ayam", "opor"],
    cal: 160, p: 12.0, c: 4.0, f: 11.0,
    unit: "100g"
  },
  {
    name: "Sambal Goreng Ati",
    keywords: ["sambal goreng ati", "goreng ati"],
    cal: 180, p: 14.0, c: 6.0, f: 11.0,
    unit: "100g"
  },
  {
    name: "Ayam Geprek",
    keywords: ["ayam geprek", "geprek"],
    cal: 320, p: 22.0, c: 14.0, f: 20.0,
    unit: "1 portion"
  },
  {
    name: "Ayam Penyet",
    keywords: ["ayam penyet"],
    cal: 280, p: 24.0, c: 2.0, f: 20.0,
    unit: "1 portion"
  },
  {
    name: "Lontong Sayur",
    keywords: ["lontong sayur", "lontong"],
    cal: 350, p: 8.0, c: 48.0, f: 14.0,
    unit: "1 bowl"
  },
  {
    name: "Ketoprak",
    keywords: ["ketoprak"],
    cal: 400, p: 10.0, c: 52.0, f: 17.0,
    unit: "1 portion"
  },
  {
    name: "Siomay Bandung (5 Biji)",
    keywords: ["siomay", "siomay bandung"],
    cal: 320, p: 14.0, c: 38.0, f: 12.0,
    unit: "1 portion (5 pieces)"
  },
  {
    name: "Batagor (Porsi)",
    keywords: ["batagor"],
    cal: 380, p: 12.0, c: 42.0, f: 18.0,
    unit: "1 portion"
  },
  {
    name: "Sayur Lodeh",
    keywords: ["sayur lodeh", "lodeh"],
    cal: 80, p: 2.0, c: 8.0, f: 5.0,
    unit: "100g"
  },
  {
    name: "Capcay Sayur",
    keywords: ["capcay", "cap cay"],
    cal: 65, p: 3.0, c: 8.0, f: 2.5,
    unit: "100g"
  },
  {
    name: "Tumis Kangkung",
    keywords: ["kangkung", "tumis kangkung", "cah kangkung"],
    cal: 75, p: 2.0, c: 6.0, f: 5.0,
    unit: "100g"
  },

  // --- POPULAR INDONESIAN FRITTERS & SNACKS ---
  {
    name: "Martabak Manis (Terang Bulan - 1 Potong)",
    keywords: ["martabak manis", "terang bulan", "martabak cokelat"],
    cal: 350, p: 7.0, c: 50.0, f: 15.0,
    unit: "1 slice"
  },
  {
    name: "Martabak Telur (1 Potong)",
    keywords: ["martabak telur", "martabak telor"],
    cal: 220, p: 9.0, c: 16.0, f: 14.0,
    unit: "1 slice"
  },
  {
    name: "Bakwan Sayur / Bala-Bala",
    keywords: ["bakwan", "bakwan sayur", "bala bala", "bala-bala", "oar-oar"],
    cal: 150, p: 2.0, c: 18.0, f: 8.0,
    unit: "1 piece"
  },
  {
    name: "Tempe Mendoan",
    keywords: ["mendoan", "tempe mendoan"],
    cal: 150, p: 5.0, c: 12.0, f: 9.0,
    unit: "1 piece"
  },
  {
    name: "Pisang Goreng",
    keywords: ["pisang goreng"],
    cal: 180, p: 1.5, c: 28.0, f: 8.0,
    unit: "1 piece"
  },
  {
    name: "Cireng",
    keywords: ["cireng"],
    cal: 120, p: 0.5, c: 22.0, f: 3.5,
    unit: "1 piece"
  },
  {
    name: "Kerupuk Putih (Kerupuk Kaleng)",
    keywords: ["kerupuk", "krupuk", "kerupuk putih"],
    cal: 65, p: 1.0, c: 10.0, f: 2.0,
    unit: "1 piece"
  },
  {
    name: "Perkedel Kentang",
    keywords: ["perkedel", "begedil"],
    cal: 120, p: 2.0, c: 18.0, f: 5.0,
    unit: "1 piece"
  },

  // --- FAST FOOD & CHEAT MEALS ---
  {
    name: "Cheeseburger",
    keywords: ["cheeseburger", "burger", "mcdonalds burger", "burger keju"],
    cal: 300, p: 15.0, c: 30.0, f: 12.0,
    unit: "1 burger (approx 115g)"
  },
  {
    name: "Pizza (Meat Lovers Slice)",
    keywords: ["pizza", "pizza slice", "pepperoni pizza", "pizza hut", "dominos pizza"],
    cal: 270, p: 12.0, c: 28.0, f: 11.0,
    unit: "1 slice (approx 100g)"
  },
  {
    name: "Kebab Daging Sapi",
    keywords: ["kebab", "kebab daging", "doner kebab", "shawarma"],
    cal: 440, p: 24.0, c: 44.0, f: 18.0,
    unit: "1 medium kebab roll"
  },
  {
    name: "Croissant Plain",
    keywords: ["croissant", "roti croissant"],
    cal: 231, p: 4.7, c: 26.1, f: 12.0,
    unit: "1 medium piece (57g)"
  },

  // --- LIQUIDS & BEVERAGES ---
  {
    name: "Kopi Hitam (Black Coffee)",
    keywords: ["kopi hitam", "black coffee", "espresso", "kopi tanpa gula"],
    cal: 2, p: 0.3, c: 0.0, f: 0.0,
    unit: "1 cup (200ml)"
  },
  {
    name: "Es Teh Manis (Sweet Iced Tea)",
    keywords: ["es teh manis", "teh manis", "sweet tea"],
    cal: 90, p: 0.0, c: 22.0, f: 0.0,
    unit: "1 glass (250ml)"
  },
  {
    name: "Boba Milk Tea",
    keywords: ["boba", "bubble tea", "milk tea boba", "chatime"],
    cal: 400, p: 4.0, c: 68.0, f: 12.0,
    unit: "1 cup (400ml)"
  },
  {
    name: "Coca-Cola / Soft Drink",
    keywords: ["coca cola", "cola", "coke", "fanta", "sprite", "soda"],
    cal: 140, p: 0.0, c: 39.0, f: 0.0,
    unit: "1 can (330ml)"
  },
  {
    name: "Air Kelapa (Coconut Water)",
    keywords: ["air kelapa", "coconut water", "kelapa muda"],
    cal: 45, p: 1.7, c: 8.9, f: 0.5,
    unit: "1 glass (250ml)"
  },
  {
    name: "Jus Alpukat (dengan Susu Cokelat)",
    keywords: ["jus alpukat", "avocado juice"],
    cal: 250, p: 3.0, c: 35.0, f: 12.0,
    unit: "1 glass (300ml)"
  },
  {
    name: "Jus Jeruk (Orange Juice)",
    keywords: ["jus jeruk", "orange juice"],
    cal: 110, p: 2.0, c: 26.0, f: 0.2,
    unit: "1 glass (250ml)"
  }
];

/**
 * Searches the nutrition dataset for a matching food keyword.
 * Returns the dataset entry or null if not found.
 */
export function matchNutritionDataset(foodName) {
  if (!foodName) return null;
  const normalized = foodName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // 1. Check for exact/word boundary match first
  for (const entry of NUTRITION_DATASET) {
    for (const kw of entry.keywords) {
      if (kw.toLowerCase() === normalized) {
        return entry;
      }
    }
  }

  // 2. Check for substring match (e.g. "nasi goreng ayam" matches "nasi goreng")
  for (const entry of NUTRITION_DATASET) {
    for (const kw of entry.keywords) {
      if (normalized.includes(kw.toLowerCase()) || kw.toLowerCase().includes(normalized)) {
        return entry;
      }
    }
  }

  return null;
}

/**
 * Custom Foods Storage Management (Local Vault via AsyncStorage)
 */
export async function getCustomFoods(userId = 'guest') {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const json = await AsyncStorage.getItem(`@gymvault_custom_foods_${userId}`);
    return json ? JSON.parse(json) : [];
  } catch (e) {

    return [];
  }
}

export async function saveCustomFood(userId = 'guest', food) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const existing = await getCustomFoods(userId);
    const newEntry = {
      id: food.id || `custom_${Date.now()}`,
      name: food.name,
      keywords: [food.name.toLowerCase()],
      cal: Number(food.cal || food.calories) || 0,
      p: Number(food.p || food.protein) || 0,
      c: Number(food.c || food.carbs) || 0,
      f: Number(food.f || food.fats) || 0,
      unit: food.unit || '1 porsi',
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    const updated = [newEntry, ...existing.filter(e => e.id !== newEntry.id)];
    await AsyncStorage.setItem(`@gymvault_custom_foods_${userId}`, JSON.stringify(updated));
    return newEntry;
  } catch (e) {

    return null;
  }
}

export async function deleteCustomFood(userId = 'guest', foodId) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const existing = await getCustomFoods(userId);
    const filtered = existing.filter(f => f.id !== foodId);
    await AsyncStorage.setItem(`@gymvault_custom_foods_${userId}`, JSON.stringify(filtered));
    return true;
  } catch (e) {

    return false;
  }
}

/**
 * Searches built-in dataset AND custom user foods simultaneously
 */
export async function searchAllFoods(query, userId = 'guest') {
  if (!query || typeof query !== 'string') return [];
  const q = query.toLowerCase().trim();
  const customFoods = await getCustomFoods(userId);
  const combined = [...customFoods, ...NUTRITION_DATASET];

  return combined.filter(item => {
    if (item.name.toLowerCase().includes(q)) return true;
    return item.keywords?.some(k => k.toLowerCase().includes(q));
  }).slice(0, 25);
}

