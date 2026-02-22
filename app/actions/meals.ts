"use server";

import { sendPrompt } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMeals() {
    const meals = await prisma.meal.findMany({
        orderBy: { createdAt: "desc" },
    });

    if (meals.length === 0) {
        // Return some mock data for the initial render as requested
        return [
            {
                id: "mock-1",
                name: "Air Fryer Lemon Herb Chicken",
                instructions: "Season chicken and air fry at 200C for 15 mins.",
                ingredients: JSON.stringify([
                    { item: "Chicken Breast", amount: "500g", cost: 65 },
                    { item: "Lemon", amount: "1", cost: 5 },
                    { item: "Herbs", amount: "1 tsp", cost: 2 },
                ]),
                calories: 450,
                protein: 45,
                carbs: 5,
                fats: 25,
                cost: 72,
                tags: "Chicken, Air Fryer, Keto-Friendly",
                rating: 5,
                chefNotes: "Juicy and simple.",
            },
            {
                id: "mock-2",
                name: "Beef & Broccoli Stir Fry",
                instructions: "Sauté beef and broccoli in a pan with soy sauce.",
                ingredients: JSON.stringify([
                    { item: "Beef Strips", amount: "400g", cost: 85 },
                    { item: "Broccoli", amount: "1 head", cost: 25 },
                    { item: "Soy Sauce", amount: "2 tbsp", cost: 5 },
                ]),
                calories: 520,
                protein: 40,
                carbs: 12,
                fats: 35,
                cost: 115,
                tags: "Beef, Keto-Friendly, Low-Carb",
                rating: 4,
                chefNotes: "Great for meal prep.",
            },
        ];
    }

    return meals;
}

export async function saveMeal(mealData: any) {
    const { id, name, instructions, ingredients, calories, protein, carbs, fats, cost, tags, rating, chefNotes } = mealData;

    let isNew = !id || id.startsWith("mock-") || id.startsWith("temp-");
    
    if (id && !isNew) {
        const existing = await prisma.meal.findUnique({ where: { id } });
        if (!existing) {
            isNew = true;
        }
    }

    console.log("[saveMeal] id:", id, "isNew:", isNew);
    console.log("[saveMeal] instructions type:", typeof instructions, instructions?.substring(0, 50));

    const prismaData = {
        name,
        instructions: typeof instructions === 'string' ? instructions : String(instructions || ''),
        ingredients: typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients),
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        cost: parseFloat(cost) || 0,
        tags: tags || "",
        rating: parseInt(rating) || 0,
        chefNotes: chefNotes || "",
    };

    console.log("[saveMeal] prismaData:", prismaData);

    try {
        if (!isNew) {
            await prisma.meal.update({
                where: { id },
                data: prismaData,
            });
        } else {
            await prisma.meal.create({
                data: prismaData,
            });
        }

        revalidatePath("/library");
        revalidatePath("/");
        revalidatePath("/planner");
        return { success: true };
    } catch (error) {
        console.error("[saveMeal] Error:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteMeal(id: string) {
    if (!id.startsWith("mock-")) {
        await prisma.meal.delete({
            where: { id },
        });
        revalidatePath("/library");
    }
}

export async function recalculateAllMealPrices() {
    const meals = await prisma.meal.findMany();
    const dbIngredients = await prisma.ingredient.findMany();
    
    // First, clean up any string prices in the database
    for (const ing of dbIngredients) {
        if (typeof ing.price === 'string') {
            const cleanPrice = parseFloat(String(ing.price).replace(/[^0-9.]/g, ''));
            if (!isNaN(cleanPrice)) {
                await prisma.ingredient.update({
                    where: { id: ing.id },
                    data: { price: cleanPrice }
                });
            }
        }
        if (typeof ing.unit === 'string' && ing.unit.includes('R')) {
            const cleanUnit = ing.unit.replace(/R/gi, '').trim();
            await prisma.ingredient.update({
                where: { id: ing.id },
                data: { unit: cleanUnit }
            });
        }
    }
    
    // Refresh the list after cleanup
    const cleanIngredients = await prisma.ingredient.findMany();
    
    const pantryStaples = [
        "salt", "pepper", "paprika", "cumin", "oregano", "basil", "thyme", "rosemary", 
        "cinnamon", "nutmeg", "chili", "chilli", "cayenne", "turmeric", "curry", 
        "garam masala", "italian herbs", "mixed herbs", "herb", "spice", "spices",
        "olive oil", "oil", "vegetable oil", "coconut oil", "butter", "ghee",
        "garlic", "onion", "onions", "shallot", "shallots", "leeks",
        "soy sauce", "worcestershire", "vinegar", "lemon juice", "lime juice",
        "stock", "broth", "bouillon", "bay leaf", "bay leaves",
        "ginger", "mustard", "mayonnaise", "tomato paste", "passata",
        "maple syrup", "bbq sauce", "sauce", "ketchup", "pickle", "pickles",
        "sesame seeds", "baking powder", "baking soda", "yeast", "flour",
        "vanilla", "extract", "cocoa", "dark chocolate", "honey",
        "hot sauce", "sriracha", "tabasco", "worcestershire sauce",
        "cream", "heavy cream", "whipping cream", "yogurt", "yoghurt",
        // Seasonings and rubs
        "rub", "seasoning", "spice rub", "steak rub", "chicken rub",
    ];
    
    const invalidItems = [
        "pet", "dog", "cat", "knife", "fork", "spoon", "plate", "bowl",
        "utensil", "cookware", "pan", "pot", "oven", "stove", 
        "parchment", "aluminum foil", "foil", "plastic wrap", "zip lock",
        "protein powder", "protein bar", "supplement"
    ];
    
    const findMatchingIngredient = (ingredientName: string): typeof cleanIngredients[0] | null => {
        const name = ingredientName.toLowerCase();
        
        // First try exact/partial match
        for (const dbIng of cleanIngredients) {
            const dbName = dbIng.name.toLowerCase();
            if (name.includes(dbName) || dbName.includes(name)) {
                return dbIng;
            }
        }
        
        // Try substitute mappings for similar items
        const substitutes: Record<string, string[]> = {
            "greek yogurt": ["yogurt", "yoghurt"],
            "nonfat": ["yogurt", "yoghurt"],
            "low fat": ["yogurt", "yoghurt"],
            "taco seasoning": ["seasoning", "spice"],
            "taco": ["seasoning", "spice"],
            "burrito": ["tortilla"],
            "pizza sauce": ["tomato", "pasta sauce", "canned tomato"],
            "pizza": ["tomato", "pasta sauce"],
            "parmesan": ["parmesan", "pecorino"],
            "parmigiano": ["parmesan", "pecorino"],
            "mozzarella": ["mozzarella", "cheese"],
            "cheddar": ["cheddar", "cheese"],
            "feta": ["feta", "cheese"],
            "ricotta": ["ricotta", "cheese"],
            "cream cheese": ["cream cheese", "cheese"],
            "tortilla": ["tortilla", "wrap"],
            "wrap": ["tortilla", "wrap"],
            "long grain": ["rice"],
            "jasmine": ["rice"],
            "basmati": ["rice"],
            "ground beef": ["mince", "beef mince"],
            "beef mince": ["mince", "ground beef"],
            "chicken thigh": ["chicken"],
            "chicken breast": ["chicken"],
            "chicken drumstick": ["chicken"],
            "avocado": ["avocado", "avocados"],
            "guacamole": ["avocado", "avocados"],
            "sour cream": ["sour cream", "cream"],
            "hot sauce": ["hot sauce", "chili"],
            "buffalo sauce": ["hot sauce", "chili"],
            "salsa": ["tomato", "fresh tomato"],
            "enchilada": ["sauce", "tomato"],
            "alfredo": ["cream", "milk"],
            "alfredo sauce": ["cream", "milk"],
            "tzatziki": ["yogurt", "yoghurt", "cucumber"],
            "shredded lettuce": ["lettuce", "salad"],
            "fresh berries": ["berries", "berries frozen", "fruit"],
            "oat flour": ["flour", "oats", "porridge"],
            "brown rice": ["rice", "white rice"],
            "zucchini": ["courgette", "cucumber", "vegetable"],
            "granola": ["cereal", "oats", "porridge"],
            "berries": ["berries", "fruit", "blueberries", "strawberries"],
        };
        
        for (const [key, alternatives] of Object.entries(substitutes)) {
            if (name.includes(key)) {
                for (const alt of alternatives) {
                    for (const dbIng of cleanIngredients) {
                        const dbName = dbIng.name.toLowerCase();
                        if (dbName.includes(alt)) {
                            return dbIng;
                        }
                    }
                }
            }
        }
        
        return null;
    };
    
    const missingPrices: string[] = [];
    const newlyEstimated: { name: string; price: number }[] = [];
    let updatedCount = 0;

    // Get unique missing ingredients
    const allMealIngredients = new Set<string>();
    for (const meal of meals) {
        const ingredients = JSON.parse(meal.ingredients);
        for (const ing of ingredients) {
            const ingName = ing.item.toLowerCase();
            if (!pantryStaples.some(s => ingName.includes(s)) && 
                !invalidItems.some(i => ingName.includes(i))) {
                const dbIng = findMatchingIngredient(ing.item);
                if (!dbIng) {
                    allMealIngredients.add(ing.item);
                }
            }
        }
    }

    // If there are missing prices, use AI to estimate them
    if (allMealIngredients.size > 0) {
        const missingList = Array.from(allMealIngredients);
        try {
            const systemPrompt = `
                You are a South African grocery pricing expert. Estimate the price per kg for these ingredients based on typical SA supermarket prices (Woolworths/Checkers).
                Return ONLY a JSON array of objects:
                [{"name": "ingredient name", "price": 0.0, "unit": "kg"}]
                
                Use these reasonable South African price estimates:
                - Common vegetables: R30-80/kg
                - Common fruits: R25-60/kg  
                - Common dairy: R40-120/kg
                - Common meats: R80-250/kg
                - Common grains/rice: R25-50/kg
                - Common cheese: R100-250/kg
                - sauces/condiments: R30-80/bottle but use per kg equivalent ~R50-100/kg
                
                If truly unknown, estimate reasonably based on similar items.
            `;
            
            const response = await sendPrompt(`Estimate prices for: ${missingList.join(", ")}`, systemPrompt);
            const estimates = JSON.parse(response);
            
            // Save estimated prices to database
            for (const est of estimates) {
                if (est.price && est.price > 0) {
                    await prisma.ingredient.upsert({
                        where: { name: est.name },
                        update: { price: est.price, unit: "kg" },
                        create: { name: est.name, price: est.price, unit: "kg" }
                    });
                    newlyEstimated.push({ name: est.name, price: est.price });
                }
            }
        } catch (error) {
            console.error("AI price estimation failed:", error);
        }
    }

    // Refresh ingredients after adding estimates
    const refreshedIngredients = await prisma.ingredient.findMany();
    
    // Update findMatchingIngredient to use refreshed list with substitutes
    const substitutes: Record<string, string[]> = {
        "greek yogurt": ["yogurt", "yoghurt"],
        "nonfat": ["yogurt", "yoghurt"],
        "low fat": ["yogurt", "yoghurt"],
        "taco seasoning": ["seasoning", "spice"],
        "burrito": ["tortilla"],
        "pizza sauce": ["tomato", "pasta sauce", "crushed tomato"],
        "parmesan": ["parmesan", "pecorino"],
        "mozzarella": ["mozzarella", "cheese"],
        "cheddar": ["cheddar", "cheese"],
        "feta": ["feta", "cheese"],
        "ricotta": ["ricotta", "cheese"],
        "cream cheese": ["cream cheese", "cheese"],
        "tortilla": ["tortilla", "wrap"],
        "wrap": ["tortilla", "wrap"],
        "long grain": ["rice"],
        "jasmine": ["rice"],
        "basmati": ["rice"],
        "ground beef": ["mince", "beef mince", "minced beef"],
        "beef mince": ["mince", "ground beef", "minced beef"],
        "lean": ["beef", "chicken", "mince"],
        "chicken thigh": ["chicken"],
        "chicken breast": ["chicken"],
        "avocado": ["avocado", "avocados"],
        "sour cream": ["sour cream", "cream"],
        "hot sauce": ["hot sauce", "chili"],
        "salsa": ["tomato"],
        "alfredo": ["cream", "milk"],
        "tzatziki": ["yogurt", "yoghurt", "cucumber"],
        "shredded lettuce": ["lettuce", "salad"],
        "shredded cheese": ["cheese", "cheddar", "mozzarella"],
        "fresh berries": ["berries", "berries frozen", "fruit"],
        "oat flour": ["flour", "oats", "porridge"],
        "brown rice": ["rice", "white rice"],
        "zucchini": ["courgette", "cucumber", "vegetable"],
        "granola": ["cereal", "oats", "porridge"],
        "berries": ["berries", "fruit", "blueberries", "strawberries"],
        "pasta": ["pasta", "spaghetti", "macaroni"],
        "crushed tomato": ["tomato", "canned tomato"],
        "cherry tomato": ["tomato"],
    };

    const findIng = (name: string): typeof refreshedIngredients[0] | null => {
        const n = name.toLowerCase();
        
        // First try exact/partial match
        for (const dbIng of refreshedIngredients) {
            const dbName = dbIng.name.toLowerCase();
            if (n.includes(dbName) || dbName.includes(n)) {
                return dbIng;
            }
        }
        
        // Try substitute mappings
        for (const [key, alternatives] of Object.entries(substitutes)) {
            if (n.includes(key)) {
                for (const alt of alternatives) {
                    for (const dbIng of refreshedIngredients) {
                        const dbName = dbIng.name.toLowerCase();
                        if (dbName.includes(alt)) {
                            return dbIng;
                        }
                    }
                }
            }
        }
        
        return null;
    };

    for (const meal of meals) {
        const ingredients = JSON.parse(meal.ingredients);
        let newTotalCost = 0;
        const updatedIngs = ingredients.map((ing: any) => {
            const ingName = ing.item.toLowerCase();
            
            const isInvalid = invalidItems.some(inv => ingName.includes(inv));
            if (isInvalid) {
                ing.cost = 0;
                ing.item = ing.item + " [INVALID - REMOVE]";
                return ing;
            }
            
            const isPantryStaple = pantryStaples.some(s => ingName.includes(s));
            if (isPantryStaple) {
                ing.cost = 0.10;
                newTotalCost += 0.10;
                return ing;
            }
            
            const dbIng = findIng(ing.item);
            if (dbIng) {
                const amount = parseAmount(ing.amount);
                const cost = calculateCost(amount, dbIng.price, dbIng.unit);
                ing.cost = Math.round(cost * 100) / 100;
                newTotalCost += ing.cost;
            } else {
                missingPrices.push(`${ing.item} (${meal.name})`);
                ing.cost = 0;
            }
            return ing;
        });

        await prisma.meal.update({
            where: { id: meal.id },
            data: {
                ingredients: JSON.stringify(updatedIngs),
                cost: Math.round(newTotalCost * 100) / 100,
            },
        });
        updatedCount++;
    }

    revalidatePath("/library");
    revalidatePath("/");
    return { 
        success: true, 
        updated: updatedCount, 
        estimated: newlyEstimated,
        missing: [...new Set(missingPrices)] 
    };
}

function parseAmount(amountStr: string): number {
    const str = amountStr.toLowerCase().replace(/[^0-9.\/]/g, '');
    
    if (str.includes('/')) {
        const parts = str.split('/');
        return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    
    const match = str.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

function calculateCost(amount: number, pricePerKg: number, unit: string): number {
    if (unit?.toLowerCase().includes('kg')) {
        return (amount / 1000) * pricePerKg;
    } else if (unit?.toLowerCase().includes('l')) {
        return (amount / 1000) * pricePerKg;
    } else if (unit?.toLowerCase().includes('each') || unit?.toLowerCase().includes('unit')) {
        return amount * pricePerKg;
    }
    return (amount / 1000) * pricePerKg;
}

export async function convertAllMeasurements() {
    const meals = await prisma.meal.findMany();
    
    if (meals.length === 0) {
        return { success: true, updated: 0 };
    }
    
    const systemPrompt = `
You are a kitchen measurement converter. Convert ALL measurements in the recipe to South African/metric units.

CONVERSION RULES:
- 1 pound (lb) = 454g
- 1 oz = 28g
- 1 ounce = 28g
- 1 cup = 240ml (for liquids) or ~240g (for solids)
- 1 tbsp = 15ml
- 1 tsp = 5ml
- Fahrenheit to Celsius: (F - 32) x 5/9

PORTIONS: This is for 2 ADULTS and 1 CHILD (age 4):
- Adult protein: 150-200g per person
- Child: 75-100g
- Total serves 2.5 people

Return ONLY a JSON array:
[{"id": "meal_id", "ingredients": [{"item": "name", "amount": "NEW_AMOUNT", "cost": 0}], "instructions": "Updated..."}]
`;

    try {
        // Process in batches of 5 to avoid overwhelming the AI
        const batchSize = 5;
        let totalUpdated = 0;
        
        for (let i = 0; i < meals.length; i += batchSize) {
            const batch = meals.slice(i, i + batchSize);
            const recipesToConvert = batch.map(m => ({
                id: m.id,
                name: m.name,
                ingredients: JSON.parse(m.ingredients),
                instructions: m.instructions
            }));
            
            const response = await sendPrompt(`Convert these ${batch.length} recipes: ${JSON.stringify(recipesToConvert)}`, systemPrompt);
            
            let conversions;
            try {
                conversions = JSON.parse(response);
            } catch {
                const match = response.match(/\[[\s\S]*\]/);
                if (match) {
                    conversions = JSON.parse(match[0]);
                } else {
                    continue;
                }
            }
            
            if (!Array.isArray(conversions)) continue;
            
            for (const conv of conversions) {
                if (conv.id && conv.ingredients) {
                    await prisma.meal.update({
                        where: { id: conv.id },
                        data: {
                            ingredients: JSON.stringify(conv.ingredients),
                            instructions: conv.instructions
                        }
                    });
                    totalUpdated++;
                }
            }
        }
        
        revalidatePath("/library");
        return { success: true, updated: totalUpdated };
    } catch (error) {
        console.error("Conversion error:", error);
        return { success: false, error: (error as Error).message };
    }
}
