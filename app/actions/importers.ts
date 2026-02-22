"use server";

import { sendPrompt } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function importRecipe(input: string) {
  const dbIngredients = await prisma.ingredient.findMany();
  const exclusions = (await prisma.appSetting.findUnique({ where: { key: "exclusions" } }))?.value || "None";

  const systemPrompt = `
    You are an expert chef and nutritionist. Extract a recipe from the provided text or URL.
    
    STRICT INGREDIENT EXCLUSIONS: ${exclusions}.
    If the source text contains any of these ingredients, SWAP them for a suitable healthy alternative if possible, or omit them.
    
    Use this ingredient pricing context to estimate costs (ZAR):
    ${JSON.stringify(dbIngredients.slice(0, 150).map(i => ({ name: i.name, price: i.price, unit: i.unit })))}
    
    Return ONLY a JSON object with the following structure:
    {
      "name": "Recipe Name",
      "instructions": "Detailed, numbered step-by-step Execution Protocol (including prep, cooking, and temperature settings). Mention if any restricted ingredients were swapped.",
      "ingredients": [
        {"item": "ingredient name", "amount": "quantity", "cost": 0.0}
      ],
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fats": 0,
      "tags": "comma, separated, tags",
      "totalCost": 0.0
    }
    
    CRITICAL: For each ingredient, estimate the fractional cost based on the quantity used and the unit prices provided above. 
    If an ingredient is not in the context list, estimate a realistic South African price.
    Tags should include main protein, cooking method (e.g. Air Fryer), and diet suitability (Keto-Friendly, Carb-Cycling).
  `;

  try {
    const response = await sendPrompt(input, systemPrompt);
    const recipe = JSON.parse(response);

    // Save to DB
    await prisma.meal.create({
      data: {
        name: recipe.name,
        instructions: recipe.instructions,
        ingredients: JSON.stringify(recipe.ingredients),
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fats: recipe.fats,
        tags: recipe.tags,
        cost: recipe.totalCost,
      },
    });

    revalidatePath("/library");
    return { success: true };
  } catch (error) {
    console.error("Import error:", error);
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
    Prices should be in ZAR (South African Rand).
  `;

  try {
    const response = await sendPrompt(text, systemPrompt);
    const items = JSON.parse(response);

    // Update ingredients database
    for (const item of items) {
      await prisma.ingredient.upsert({
        where: { name: item.name },
        update: { price: item.price, unit: item.unit },
        create: { name: item.name, price: item.price, unit: item.unit },
      });
    }

    revalidatePath("/importer");
    return { success: true, count: items.length };
  } catch (error) {
    console.error("Price import error:", error);
    return { success: false, error: (error as Error).message };
  }
}
