import { getMeals } from "@/app/actions/meals";
import MealLibrary from "./MealLibrary";

export default async function LibraryPage() {
    const meals = await getMeals();

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Meal Library</h1>
                <p style={{ color: "gray", fontSize: "1.1rem" }}>
                    Browse, search, and manage your family's favorite recipes.
                </p>
            </header>

            <MealLibrary initialMeals={meals} />
        </div>
    );
}
