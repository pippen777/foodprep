"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIngredients() {
    return await prisma.ingredient.findMany({
        orderBy: { name: "asc" },
    });
}

export async function updateIngredient(id: string, data: any) {
    await prisma.ingredient.update({
        where: { id },
        data: {
            name: data.name,
            price: parseFloat(data.price),
            unit: data.unit,
            tags: data.tags,
        },
    });
    revalidatePath("/inventory");
}

export async function deleteIngredient(id: string) {
    await prisma.ingredient.delete({
        where: { id },
    });
    revalidatePath("/inventory");
}
