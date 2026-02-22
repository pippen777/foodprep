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
  const ingredients = await prisma.ingredient.findMany();
  const ratedMeals = meals.filter(m => m.rating >= 3);
  const lowRatedMeals = meals.filter(m => m.rating < 3).map(m => m.name);

  const systemPrompt = `
    You are "Food Crib AI", a family meal planner. Target: 2 adults, one 4-year-old in South Africa.
    Budget: Strictly under R400 per day.
    Diet Mode: ${dietMode} (Carb-Cycling: carbs at lunch, low-carb dinner. Keto: zero starch).
    Cooking: 15-min active prep, Air Fryer/Oven preferred. Slow cooker max once a week.
    
    ${mealType === 'lunch' ? 'FOCUS: Generate ONLY LUNCHES.' : ''}
    ${mealType === 'dinner' ? 'FOCUS: Generate ONLY DINNERS.' : ''}

    💸 BUDGET RULE 1: Always prioritize the most affordable option (e.g., hand-make patties from mince).
    📦 BUDGET RULE 2 (Bulk Strategy): If buying an ingredient in bulk (e.g., 2kg-5kg chicken/mince) is 20%+ cheaper per kg than small packs, plan 2-3 different meals during the week using that same ingredient to maximize savings and reduce waste.
    
    Ingredient Inventory (for pricing context): ${JSON.stringify(ingredients.map((i: any) => ({ name: i.name, price: i.price, unit: i.unit, tags: i.tags })))}
    Current Library Meals: ${JSON.stringify(ratedMeals.map(m => ({ name: m.name, tags: m.tags, cost: m.cost })))}
    NEVER suggest: ${lowRatedMeals.join(", ")}
    
    Cravings to adapt if needed (ensure handmade version if cheaper): Burgers, Pizza, Lasagna, Meatballs, Curry, Chicken & Broccoli, Steak & Salad, Bread, Chicken Cordon Bleu, Schnitzel.
    
    Return ONLY a JSON object:
    {
      "meals": [
        {
          "day": 1,
          ${mealType === 'all' ? '"breakfast": {"name": "...", "cost": 0},' : ''}
          ${mealType === 'all' || mealType === 'lunch' ? '"lunch": {"name": "...", "cost": 0},' : ''}
          ${mealType === 'all' || mealType === 'dinner' ? '"dinner": {"name": "...", "cost": 0},' : ''}
          "totalCost": 0
        }
      ],
      "totalWeeklyCost": 0
    }
  `;

  try {
    const response = await sendPrompt(`Generate a ${days}-day ${mealType === 'all' ? '' : mealType + ' '}meal plan.`, systemPrompt);
    const plan = JSON.parse(response);

    // Save to History
    await prisma.mealPlan.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        meals: JSON.stringify(plan.meals),
        dietMode,
        totalCost: plan.totalWeeklyCost,
      },
    });

    revalidatePath("/history");
    return { success: true, plan };
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
    Return ONLY JSON:
    {
      "name": "...",
      "instructions": "...",
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

  const systemPrompt = `
    You are the "Food Crib Lead Researcher". The user wants to find: "${query}".
    Provide 4 distinct variations of this meal.
    Selection Criteria:
    1. Budget Friendly (Maximize value/bulk ingredients).
    2. Fast & Easy (Focus on prep time under 15 mins).
    3. Gourmet Twist (Elevated flavor profile).
    4. Food Crib Signature (Optimized by AI for Best Taste, Easy Prep, Healthy, and Weight-Loss/Macro-balance).
    
    Context:
    - Current Library Favorites (highly rated): ${topRated.join(", ")}
    - Ingredient Pricing Context: ${JSON.stringify(ingredients.map((i: any) => ({ name: i.name, price: i.price, unit: i.unit })))}
    
    Return ONLY a JSON array of 4 objects:
    [
      {
        "name": "...",
        "variation": "Budget | Fast & Easy | Gourmet | Food Crib Signature",
        "instructions": "...",
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

export async function recalculateCosts(ingredients: any[]) {
  const dbIngredients = await prisma.ingredient.findMany();
  const systemPrompt = `
    You are a Cost Estimator. Update the 'cost' field for each ingredient provided based on this pricing context (ZAR):
    ${JSON.stringify(dbIngredients.map(i => ({ name: i.name, price: i.price, unit: i.unit })))}
    
    Return ONLY a JSON array of ingredient objects with the updated costs.
    Keep the original 'item' and 'amount' fields exactly as they are.
  `;

  try {
    const response = await sendPrompt(`Recalculate costs for: ${JSON.stringify(ingredients)}`, systemPrompt);
    return { success: true, ingredients: JSON.parse(response) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

