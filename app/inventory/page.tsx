import { getMeals } from "@/app/actions/meals";
import { getIngredients } from "@/app/actions/ingredients";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
    const meals = await getMeals();
    const ingredients = await getIngredients();

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Inventory Manager</h1>
                <p style={{ color: "gray", fontSize: "1.1rem" }}>
                    Manage your master lists of recipes and ingredients.
                </p>
            </header>

            <InventoryClient initialMeals={meals} initialIngredients={ingredients} />
        </div>
    );
}
