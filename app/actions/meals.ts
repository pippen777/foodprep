"use server";

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

    const isNew = !id || id.startsWith("mock-") || id.startsWith("temp-");

    const prismaData = {
        name,
        instructions,
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
}

export async function deleteMeal(id: string) {
    if (!id.startsWith("mock-")) {
        await prisma.meal.delete({
            where: { id },
        });
        revalidatePath("/library");
    }
}
