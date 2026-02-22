"use server";

import { sendPrompt } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function parseRecipe(input: string) {
  const dbIngredients = await prisma.ingredient.findMany();
  const exclusions = (await prisma.appSetting.findUnique({ where: { key: "exclusions" } }))?.value || "None";

  const systemPrompt = `
    You are an expert chef and nutritionist. Extract a recipe from the provided text or URL.
    
    GOAL: Create a professional, logical, and delicious recipe. 
    If the source text is messy, brief, or missing logical steps (like the user just listing ingredients), FILL IN THE BLANKS. 
    Add realistic preparation steps, cooking times, and temperatures if they are missing.
    Ensure the sequence of instructions makes sense for a home cook.

    CRITICAL: Use METRIC UNITS ONLY (grams, kg, ml, litres, Celsius). Convert all US/imperial measurements to metric.
    South Africa uses the metric system - always use grams/g, kg, ml, litres/L, and Celsius for temperatures.

    CRITICAL: PORTION SIZES - This recipe is for 2 ADULTS and 1 CHILD (age 4). Scale portions accordingly:
    - Adult main protein: 150-200g raw weight per person
    - Child portion: roughly half adult portion (75-100g)
    - Vegetables: 150-200g per adult, 75-100g per child
    - Total recipe should serve 2.5 people

    STRICT INGREDIENT EXCLUSIONS: ${exclusions}.
    If the source text contains any of these ingredients, SWAP them for a suitable healthy alternative if possible, or omit them.
    
    NEVER include these non-food items in ingredients: pet food, dog food, cat food, knife, fork, spoon, plate, bowl, utensils, cookware, pans, pots
    
    Use this EXACT ingredient pricing from database (ZAR) - DO NOT GUESS:
    ${JSON.stringify(dbIngredients.slice(0, 200).map(i => ({ name: i.name.toLowerCase(), price: i.price, unit: i.unit })))}
    
    Return ONLY a JSON object with the following structure:
    {
      "name": "Recipe Name",
      "instructions": "Detailed, numbered step-by-step Execution Protocol (including prep, cooking, and temperature settings). Mention if any restricted ingredients were swapped.",
      "ingredients": [
        {"item": "ingredient name", "amount": "quantity in metric", "cost": 0.0}
      ],
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fats": 0,
      "tags": "comma, separated, tags",
      "totalCost": 0.0
    }
    
    COST CALCULATION RULES:
    1. ONLY use prices from the database list for main ingredients (meats, vegetables, dairy)
    2. Use SUBSTITUTE PRICING for similar items:
       - Greek Yogurt / Nonfat Yogurt → use plain Yogurt price
       - Taco Seasoning / Any seasoning blend → use Seasoning/Mixed Herbs price
       - Pizza Sauce / Pasta Sauce → use Tomato & Basil Pasta Sauce or Canned Tomatoes price
       - Parmesan (grated) → use Parmesan Cheese price
       - Mozzarella / Cheddar / Feta → use that specific cheese price if available, or generic Cheese price
       - Tortilla / Wrap → use Tortilla price
       - Rice (any type) → use Rice price
       - Ground Beef / Beef Mince → use Beef Mince price
       - Chicken Thigh/Breast/Drumstick → use Chicken price
       - Zucchini → use Cucumber or Vegetable price
       - Oat Flour → use Flour or Oats price
       - Shredded Lettuce → use Lettuce or Salad price
       - Fresh Berries → use Frozen Berries or Fruit price
    3. PANTRY STAPLES (always set cost to R0.10): salt, pepper, paprika, cumin, oregano, basil, thyme, rosemary, cinnamon, nutmeg, chili, cayenne, turmeric, curry powder, garam masala, mixed herbs, olive oil, vegetable oil, coconut oil, butter, ghee, garlic, onion, shallots, leeks, soy sauce, worcestershire sauce, vinegar, lemon juice, lime juice, stock, broth, bay leaves, ginger, mustard, mayonnaise, tomato paste, maple syrup, BBQ sauce, ketchup, hot sauce, sesame seeds, baking powder, vanilla extract, cocoa, honey
    4. EXCLUDE NON-FOOD ITEMS (set cost 0, don't include in recipe): parchment paper, aluminum foil, plastic wrap, protein powder, protein bars, supplements
    5. These pantry staples still appear on shopping list but are R0.10 each
    6. Calculate cost as: (quantity / unit_size) * unit_price - so for 200g beef at R200/kg = (200/1000) * 200 = R40
    7. Example: 200g rump steak at R219.99/kg = R43.99 per recipe portion (for 2.5 people, use ~500g total = R110)
    
    Tags should include main protein, cooking method (e.g. Air Fryer), and diet suitability (Keto-Friendly, Carb-Cycling).
  `;

  try {
    const response = await sendPrompt(input, systemPrompt);
    const recipe = JSON.parse(response);
    return { success: true, recipe };
  } catch (error) {
    console.error("Parse error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function saveRecipe(recipe: any) {
  try {
    const instructions = Array.isArray(recipe.instructions) 
      ? recipe.instructions.join("\n") 
      : recipe.instructions;
    
    await prisma.meal.create({
      data: {
        name: recipe.name,
        instructions,
        ingredients: JSON.stringify(recipe.ingredients),
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fats: recipe.fats,
        tags: recipe.tags,
        cost: recipe.totalCost || recipe.cost,
      },
    });

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    console.error("Save error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function importPrices(text: string) {
  const systemPrompt = `
    You are a data extractor. Extract a JSON array of ingredients from the messy grocery text provided.
    Return ONLY a JSON array of objects:
    [
      {"name": "Ingredient Name", "price": 0.0, "unit": "kg/g/each/etc"}
    ]
    CRITICAL: 
    - Prices must be NUMBERS ONLY (e.g., 35.99), NOT strings with "R" (e.g., NOT "R35.99")
    - Strip any "R", "R ", "R" prefix from prices
    - Units should be clean (e.g., "500g", "1kg", "1L", "each")
  `;

  try {
    const response = await sendPrompt(text, systemPrompt);
    const items = JSON.parse(response);

    // Update ingredients database
    for (const item of items) {
      const priceValue = typeof item.price === 'string' 
        ? parseFloat(item.price.replace(/[^0-9.]/g, '')) 
        : item.price;
      const unitValue = typeof item.unit === 'string' 
        ? item.unit.replace(/R/gi, '').trim() 
        : item.unit;
      
      await prisma.ingredient.upsert({
        where: { name: item.name },
        update: { price: priceValue, unit: unitValue },
        create: { name: item.name, price: priceValue, unit: unitValue },
      });
    }

    revalidatePath("/importer");
    return { success: true, count: items.length };
  } catch (error) {
    console.error("Price import error:", error);
    return { success: false, error: (error as Error).message };
  }
}
