"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveCustomMealPlan(meals: any[], dietMode: string) {
    const totalCost = meals.reduce((sum, day) => {
        return sum + (day.breakfast?.cost || 0) + (day.lunch?.cost || 0) + (day.dinner?.cost || 0);
    }, 0);

    await prisma.mealPlan.create({
        data: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            meals: JSON.stringify(meals),
            dietMode,
            totalCost,
        },
    });

    revalidatePath("/history");
    revalidatePath("/");
}
