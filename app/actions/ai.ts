"use server";

import { sendPrompt } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export async function generateWeeklyPlan(days: number = 7, mealType: "lunch" | "dinner" | "all" = "all") {
  const settings = await prisma.appSetting.findMany();
  const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);

  const dietMode = settingsMap.diet_mode || "Carb-Cycling";
  const meals = await prisma.meal.findMany();

  if (meals.length === 0) {
    return { success: false, error: "Your library is empty. Add some meals first!" };
  }

  const ingredients = await prisma.ingredient.findMany();
  const lowRatedMeals = meals.filter(m => m.rating < 3).map(m => m.name);
  const ingredientContext = ingredients.slice(0, 150).map((i: any) => ({ name: i.name, price: i.price }));

  // LIGHTWEIGHT CONTEXT: Only send names, tags, and costs. No instructions or objects.
  const libraryContext = meals.map(m => ({
    name: m.name,
    tags: m.tags,
    cost: m.cost
  }));

  console.log(`[AI Planner] Generating ${days} days... Library Size: ${meals.length}`);

  const systemPrompt = `
    You are "Food Crib AI", a family meal planner. Target: 2 adults, one 4-year-old in South Africa.
    Budget: Strictly under R400 per day.
    Diet Mode: ${dietMode} (Carb-Cycling: carbs at lunch, low-carb dinner. Keto: zero starch).
    
    ${mealType === 'lunch' ? 'FOCUS: Generate ONLY LUNCHES. In the JSON, the "dinner" key MUST be null for every day.' : ''}
    ${mealType === 'dinner' ? 'FOCUS: Generate ONLY DINNERS. In the JSON, the "lunch" key MUST be null for every day.' : ''}
    ${mealType === 'all' ? 'Include both lunch and dinner.' : ''}

    STRICTEST RULE: You are ONLY allowed to use meals from the "Current Library Meals" list below. 
    STRICT ZERO TOLERANCE for generating new or outside meals. 
    If you reach the end of the list, REPEAT meals from the library.
    
    Inventory Context: ${JSON.stringify(ingredientContext)}
    Current Library Meals: ${JSON.stringify(libraryContext)}
    NEVER suggest (Low Rated): ${lowRatedMeals.join(", ")}
    STRICT INGREDIENT EXCLUSIONS: ${settingsMap.exclusions || 'None'}
    
    Return ONLY a JSON object:
    {
      "meals": [
        {
          "day": 1,
          "lunch": { "name": "MEAL_NAME_FROM_LIBRARY", "cost": 0 },
          "dinner": { "name": "MEAL_NAME_FROM_LIBRARY", "cost": 0 },
          "totalCost": 0
        }
      ],
      "shoppingList": [
        { "item": "...", "amount": "...", "estimatedCost": 0 }
      ],
      "totalWeeklyCost": 0
    }
  `;

  try {
    const rawResponse = await sendPrompt(`Generate a ${days}-day ${mealType === 'all' ? '' : mealType + ' '}meal plan using MY library.`, systemPrompt);
    const plan = JSON.parse(rawResponse);

    // HYDRATION: Take the names from the AI and find the ACTUAL data in our DB
    const finalMeals = plan.meals.map((day: any) => {
      const hydrateMeal = (meal: any) => {
        if (!meal || !meal.name) return null;
        const dbMeal = meals.find(m => m.name.toLowerCase() === meal.name.toLowerCase());
        if (!dbMeal) return null; // AI Hallucinated - filter it out or just omit details
        return {
          ...meal,
          ingredients: JSON.parse(dbMeal.ingredients),
          instructions: dbMeal.instructions,
          cost: dbMeal.cost
        };
      };

      return {
        ...day,
        lunch: hydrateMeal(day.lunch),
        dinner: hydrateMeal(day.dinner)
      };
    });

    // Properly aggregate shopping list from actual meal ingredients
    const ingredientMap = new Map();
    
    for (const day of finalMeals) {
      for (const mealType of ['lunch', 'dinner']) {
        const meal = day[mealType];
        if (meal && meal.ingredients) {
          for (const ing of meal.ingredients) {
            const key = ing.item.toLowerCase();
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key);
              existing.amount += ` + ${ing.amount}`;
              existing.cost += ing.cost || 0;
            } else {
              ingredientMap.set(key, {
                item: ing.item,
                amount: ing.amount,
                cost: ing.cost || 0
              });
            }
          }
        }
      }
    }

    const aggregatedShoppingList = Array.from(ingredientMap.values()).map(item => ({
      item: item.item,
      amount: item.amount,
      estimatedCost: Math.round(item.cost * 100) / 100
    }));

    const totalWeeklyCost = finalMeals.reduce((sum: number, day: any) => {
      const lunchCost = day.lunch?.cost || 0;
      const dinnerCost = day.dinner?.cost || 0;
      return sum + lunchCost + dinnerCost;
    }, 0);

    const finalPlan = { 
      ...plan, 
      meals: finalMeals,
      shoppingList: aggregatedShoppingList,
      totalWeeklyCost: Math.round(totalWeeklyCost * 100) / 100
    };

    // Save to History
    await prisma.mealPlan.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        meals: JSON.stringify({
          meals: finalPlan.meals,
          shoppingList: finalPlan.shoppingList
        }),
        dietMode,
        totalCost: finalPlan.totalWeeklyCost,
      },
    });

    revalidatePath("/history");
    return { success: true, plan: finalPlan };
  } catch (error) {
    console.error("Generation error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function surpriseMe() {
  const count = await prisma.meal.count();
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const meal = await prisma.meal.findFirst({ skip });
  return meal;
}

export async function pantryChef(ingredients: string) {
  const systemPrompt = `
    You are a Pantry Chef. Using ONLY the ingredients provided, generate a budget-friendly, macro-compliant recipe.
    Factor in diet mode and South African budget (R400/day total).

    STRICT INGREDIENT EXCLUSIONS (Do not use these): ${await getSetting('exclusions') || 'None'}
    Return ONLY JSON:
    {
      "name": "...",
      "instructions": "Detailed, numbered step-by-step Execution Protocol (prep and cooking).",
      "ingredients": [{"item": "...", "amount": "..."}],
      "macros": {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    }
  `;

  try {
    const response = await sendPrompt(`I have these ingredients: ${ingredients}`, systemPrompt);
    return { success: true, recipe: JSON.parse(response) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getMealPlans() {
  return await prisma.mealPlan.findMany({
    orderBy: { startDate: "desc" },
  });
}

export async function getLatestMealPlan() {
  const plan = await prisma.mealPlan.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!plan) return null;

  const parsed = JSON.parse(plan.meals);

  // Normalize legacy data: if parsed data is a simple array, wrap it in the new object structure
  const mealsData = Array.isArray(parsed) ? { meals: parsed, shoppingList: [] } : parsed;

  return {
    ...plan,
    meals: mealsData
  };
}

export async function deleteMealPlan(id: string) {
  await prisma.mealPlan.delete({
    where: { id },
  });
  revalidatePath("/history");
  revalidatePath("/");
}

export async function updateMealPlan(id: string, meals: any[], shoppingList: any[], totalCost: number) {
  await prisma.mealPlan.update({
    where: { id },
    data: {
      meals: JSON.stringify({ meals, shoppingList }),
      totalCost
    },
  });
  revalidatePath("/history");
  revalidatePath("/");
}

export async function updateMealRating(mealId: string, rating: number, chefNotes?: string) {
  await prisma.meal.update({
    where: { id: mealId },
    data: { rating, chefNotes },
  });
  revalidatePath("/library");
  revalidatePath("/");
}

export async function searchMealOptions(query: string) {
  const ingredients = await prisma.ingredient.findMany();
  const meals = await prisma.meal.findMany();
  const topRated = meals.filter(m => m.rating >= 4).map(m => m.name);
  const ingredientContext = ingredients.slice(0, 200).map((i: any) => ({ name: i.name.toLowerCase(), price: i.price, unit: i.unit }));

  const systemPrompt = `
    You are the "Food Crib Lead Researcher". The user wants to find: "${query}".
    Provide 4 distinct variations of this meal.
    
    CRITICAL: PORTION SIZES - This recipe is for 2 ADULTS and 1 CHILD (age 4). Scale portions accordingly:
    - Adult main protein: 150-200g raw weight per person
    - Child portion: roughly half adult portion (75-100g)
    - Vegetables: 150-200g per adult, 75-100g per child
    - Total recipe should serve 2.5 people

    Selection Criteria:
    1. Budget Friendly (Maximize value/bulk ingredients).
    2. Fast & Easy (Focus on prep time under 15 mins).
    3. Gourmet Twist (Elevated flavor profile).
    4. Food Crib Signature (Optimized by AI for Best Taste, Easy Prep, Healthy, and Weight-Loss/Macro-balance).
    
    Context:
    - Current Library Favorites (highly rated): ${topRated.join(", ")}
    - EXACT Ingredient Pricing from database (ZAR) - DO NOT GUESS:
    ${JSON.stringify(ingredientContext)}
    - STRICT INGREDIENT EXCLUSIONS (Do not use these): ${await getSetting('exclusions') || 'None'}
    - NEVER include non-food items: pet food, dog food, cat food, knife, fork, spoon, plate, bowl, utensils
    
    COST RULES:
    1. ONLY use prices from the database list for main ingredients (meats, vegetables, dairy)
    2. Use SUBSTITUTE PRICING for similar items when exact match not found:
       - Greek Yogurt / Nonfat → use Yogurt price
       - Taco Seasoning → use Seasoning price
       - Pizza Sauce → use Pasta Sauce or Canned Tomatoes price
       - Parmesan (grated) → use Parmesan Cheese price
       - Mozzarella / Cheddar / Feta → use that cheese price or generic Cheese
       - Tortilla / Wrap → use Tortilla price
       - Rice (any type) → use Rice price
       - Ground Beef / Mince → use Beef Mince price
       - Chicken Thigh/Breast → use Chicken price
       - Zucchini → use Cucumber price
       - Oat Flour → use Flour price
       - Shredded Lettuce → use Lettuce price
       - Fresh Berries → use Frozen Berries price
    3. PANTRY STAPLES (always R0.10): salt, pepper, paprika, cumin, oregano, basil, thyme, rosemary, cinnamon, nutmeg, chili, cayenne, turmeric, curry, mixed herbs, olive oil, butter, garlic, onion, soy sauce, vinegar, stock, bay leaves, mustard, mayonnaise, tomato paste, maple syrup, BBQ sauce, ketchup, hot sauce, sesame seeds, baking powder, vanilla, cocoa, honey
    4. EXCLUDE NON-FOOD: parchment paper, aluminum foil, protein powder, supplements
    5. These pantry staples still appear on shopping list but are R0.10 each
    6. If ingredient NOT in database (and not pantry staple), set cost to 0 and add "(PRICE UNKNOWN)" to item name
    7. Calculate: cost = (quantity_in_g / 1000) * price_per_kg OR (quantity_in_ml / 1000) * price_per_litre
    
    Return ONLY a JSON array of 4 objects:
    [
      {
        "name": "...",
        "variation": "Budget | Fast & Easy | Gourmet | Food Crib Signature",
        "instructions": "Detailed, numbered step-by-step Execution Protocol (prep and cooking).",
        "ingredients": [{"item": "...", "amount": "...", "cost": 0}],
        "calories": 0, "protein": 0, "carbs": 0, "fats": 0,
        "tags": "...",
        "cost": 0
      }
    ]
  `;

  try {
    const response = await sendPrompt(`I want to cook: ${query}`, systemPrompt);
    return { success: true, options: JSON.parse(response) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recalculateCosts(mealIngredients: any[]) {
  const dbIngredients = await prisma.ingredient.findMany();

  const relevantPricing = dbIngredients.filter(db =>
    mealIngredients.some(mi => mi.item.toLowerCase().includes(db.name.toLowerCase()) || db.name.toLowerCase().includes(mi.item.toLowerCase()))
  ).slice(0, 100);

  const systemPrompt = `
    You are a Cost Estimator. Update the 'cost' field for each ingredient provided based on this pricing context (ZAR):
    ${JSON.stringify(relevantPricing.map(i => ({ name: i.name, price: i.price, unit: i.unit })))}
    
    Return ONLY a valid JSON array of ingredient objects. Keep the original 'item' and 'amount' fields exactly as they are.
    Example: [{"item": "Chicken", "amount": "500g", "cost": 50}]
  `;

  try {
    const response = await sendPrompt(`Recalculate costs for: ${JSON.stringify(mealIngredients)}`, systemPrompt);
    
    // Try to fix JSON if slightly malformed
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch {
      // Try to find JSON array in response
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON response");
      }
    }
    
    return { success: true, ingredients: parsed };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

