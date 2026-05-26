// Premium content — 10 collections.
// Each collection has 2-3 fleshed-out recipes; the collection itself is the "wow" content.

const STD_TOOLS_BASIC = ["Pan", "Wooden spoon", "Knife"];

export const COLLECTIONS = [
  {
    slug: "moving-out",
    title: "Moving Out Survival Pack",
    tagline: "The 12 dishes that get you through your first month away from home.",
    positioning: "PARENTS — peace of mind. TEENS — actually fed.",
    color: "#FACC15",
    badge: "ESSENTIAL",
    recipes: [
      { slug: "one-pan-mince", title: "One-Pan Mince + Veg + Rice", time: "20 min", body: "Brown 250g mince in a pan. Add a chopped onion, a tin of chopped tomatoes, a handful of frozen peas, and a mug of cooked rice. Stir 5 min. Done." },
      { slug: "tuna-pasta-bake", title: "Tuna Pasta in 1 Pan", time: "12 min", body: "Boil pasta. Drain. Back in the pan with a tin of tuna, a dollop of mayo or crème fraîche, salt, pepper, and frozen sweetcorn. Stir off-heat." },
      { slug: "midweek-stir-fry", title: "Anything-You-Have Stir Fry", time: "10 min", body: "Hot pan + 1 tbsp oil. Throw in whatever veg you've got, chopped small. Cook 3 min. Add cooked chicken/tofu/egg. Splash of soy. Onto rice." },
    ],
  },
  {
    slug: "budget",
    title: "Budget Meals (£2 or less)",
    tagline: "When the bank balance hits single digits.",
    positioning: "Students — eat well for the price of a coffee.",
    color: "#84CC16",
    badge: "£2 OR LESS",
    recipes: [
      { slug: "egg-fried-rice", title: "Cupboard Egg Fried Rice", time: "8 min", body: "2 eggs + day-old rice + frozen peas + soy. The cheapest hot meal on earth." },
      { slug: "lentil-curry", title: "Lazy Lentil Curry", time: "20 min", body: "Tin of lentils + tin of chopped tomatoes + 1 tsp curry powder + onion. Simmer 15 min. With rice or naan." },
      { slug: "jacket-and-beans", title: "Microwave-Jacket + Beans", time: "12 min", body: "Microwave a potato 8 min. Open while hot. Beans on top. Cheese on top of beans. Salt, butter, life is fine." },
    ],
  },
  {
    slug: "air-fryer",
    title: "Air Fryer Recipes",
    tagline: "Crispy, fast, no oven, no oil baths.",
    positioning: "Got an air fryer for Christmas? Here's why.",
    color: "#EF4444",
    badge: "AIR FRYER",
    recipes: [
      { slug: "af-chicken-thighs", title: "Air Fryer Crispy Chicken Thighs", time: "18 min", body: "Bone-in thighs, skin-side down, 200°C, 12 min. Flip, 6 min more. Skin shatters when you bite it." },
      { slug: "af-fries", title: "10-Minute Fries", time: "10 min", body: "Chip-cut a potato. 1 tsp oil + salt. 200°C 8-10 min, shake halfway. Better than chip-shop." },
      { slug: "af-salmon", title: "5-Min Air Fryer Salmon", time: "7 min", body: "Salmon skin-side down, brush with soy + honey, 180°C 7 min. Glaze caramelises. Serve with rice." },
    ],
  },
  {
    slug: "study-snacks",
    title: "Study Snacks",
    tagline: "Brain food. No sugar crash. Made in 5 minutes.",
    positioning: "For exam season — fuel that doesn't make you nap.",
    color: "#3B82F6",
    badge: "BRAIN FUEL",
    recipes: [
      { slug: "pb-banana-toast", title: "PB Banana Toast", time: "3 min", body: "Toast. Peanut butter. Sliced banana. Honey if you want. Slow-release energy + protein." },
      { slug: "yoghurt-bowl", title: "Yoghurt + Berry + Oat Bowl", time: "2 min", body: "Greek yoghurt + frozen berries + 2 tbsp oats + a drizzle of honey. Done." },
      { slug: "tuna-cucumber", title: "Tuna Cucumber Boats", time: "5 min", body: "Cucumber halved + scooped. Fill with tuna mixed with mayo, lemon, pepper. Crunchy + protein, zero crash." },
    ],
  },
  {
    slug: "late-night",
    title: "Late Night Meals",
    tagline: "It's 11pm. You're hungry. The kitchen is dark.",
    positioning: "Quiet, fast, low-mess. Parents are asleep.",
    color: "#A855F7",
    badge: "AFTER HOURS",
    recipes: [
      { slug: "midnight-noodles", title: "Midnight Instant Noodles, Upgraded", time: "5 min", body: "Boil noodles. Drain. Add the seasoning + a knob of butter + an egg yolk + 1 tsp soy. Stir. Don't tell anyone." },
      { slug: "post-pub-toastie", title: "Post-Pub Cheese Toastie", time: "5 min", body: "Butter the OUTSIDE of two slices. Cheese inside. Frying pan, lid on, low heat, 3 min each side." },
      { slug: "quiet-quesadilla", title: "Stealth Quesadilla", time: "4 min", body: "Tortilla in a dry pan. Cheese + leftovers on half. Fold. 90 sec each side. Cuts in 4." },
    ],
  },
  {
    slug: "meal-plan",
    title: "Weekly Meal Plans",
    tagline: "5 dinners. 1 shop. 0 'what's for tea' arguments.",
    positioning: "FOR PARENTS — gift your teen a week of independence.",
    color: "#F59E0B",
    badge: "PLAN",
    recipes: [
      { slug: "week-classic", title: "The Classic Week", time: "5 dinners", body: "Mon: pasta · Tue: stir fry · Wed: jacket + beans · Thu: omelette · Fri: pizza toast. Total shop ~£18." },
      { slug: "week-budget", title: "The £20 Week", time: "7 dinners", body: "Bulk-cook chilli Sunday. Reheat 3 nights. Egg fried rice, pasta bake, beans on toast fill the rest." },
    ],
  },
  {
    slug: "grocery",
    title: "Smart Grocery Lists",
    tagline: "Auto-generated from your meal plan. Aisle-by-aisle.",
    positioning: "Saves £8-£12/week on impulse buys.",
    color: "#10B981",
    badge: "SHOPPING",
    recipes: [
      { slug: "basics-list", title: "The Student Basics", time: "Weekly", body: "Pasta · Rice · Eggs · Tinned tomatoes · Tinned beans · Onions · Garlic · Frozen peas · Butter · Bread · Cheese · Milk." },
      { slug: "fresh-week", title: "Fresh Top-Up", time: "Weekly", body: "Salad · Tomatoes · Cucumber · Banana · Yoghurt · A protein for 3 meals (chicken/mince/salmon)." },
    ],
  },
  {
    slug: "offline",
    title: "Offline Saved Recipes",
    tagline: "Star a recipe. Cook it without signal.",
    positioning: "For the rented flat with the dodgy WiFi.",
    color: "#06B6D4",
    badge: "OFFLINE",
    recipes: [
      { slug: "offline-info", title: "How Offline Works", time: "Always", body: "Star any recipe — we cache it on your device so you can open it without internet. Up to 50 recipes." },
    ],
  },
  {
    slug: "seasonal",
    title: "Seasonal Content",
    tagline: "New recipes every month. Halloween, Christmas, BBQ season.",
    positioning: "Always something new — gives teens a reason to open the app.",
    color: "#F97316",
    badge: "SEASONAL",
    recipes: [
      { slug: "halloween-pumpkin", title: "Halloween Pumpkin Soup", time: "30 min", body: "Coming in October." },
      { slug: "christmas-bubble", title: "Christmas Bubble & Squeak", time: "15 min", body: "Coming in December." },
      { slug: "summer-bbq", title: "Summer BBQ Marinade", time: "10 min + rest", body: "Coming in June." },
    ],
  },
  {
    slug: "cosmetics",
    title: "Kitchen Cosmetics",
    tagline: "Customise your sandbox theme. Yellow, Neon Pink, Mint, Slime.",
    positioning: "Self-expression for teens. They actually love this.",
    color: "#EC4899",
    badge: "COSMETICS",
    recipes: [
      { slug: "theme-yellow", title: "Classic Yellow (default)", time: "Free", body: "The original brutalist arcade." },
      { slug: "theme-neon", title: "Neon Pink", time: "Premium", body: "Vapourwave vibes. The kitchen at 1am." },
      { slug: "theme-mint", title: "Mint Calm", time: "Premium", body: "For revision arc." },
      { slug: "theme-slime", title: "Toxic Slime", time: "Premium", body: "The 'I cooked it' chaos aesthetic." },
    ],
  },
];

// Additional premium-only achievements
export const PREMIUM_BADGES = [
  { id: "p-survivor",    name: "Moving Out Survivor",  description: "Tried 3 recipes from the Moving Out Survival Pack.",  icon: "Backpack",   premium: true },
  { id: "p-budget",      name: "Budget Boss",          description: "Cooked 3 budget meals under £2.",                     icon: "Wallet",     premium: true },
  { id: "p-airfryer",    name: "Air Fryer Pilot",      description: "Mastered 3 air-fryer recipes.",                       icon: "Wind",       premium: true },
  { id: "p-meal-plan",   name: "Planner",              description: "Built your first weekly meal plan.",                  icon: "CalendarDays", premium: true },
  { id: "p-grocery",     name: "Grocery Hero",         description: "Sent a grocery list to your phone.",                  icon: "ShoppingCart", premium: true },
  { id: "p-seasonal",    name: "Seasonal Eater",       description: "Tried 3 seasonal recipes.",                            icon: "Leaf",       premium: true },
];

export const getCollection = (slug) => COLLECTIONS.find((c) => c.slug === slug);
