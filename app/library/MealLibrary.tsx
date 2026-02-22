"use client";

import { useState } from "react";
import MealDetail from "./MealDetail";

interface Meal {
    id: string;
    name: string;
    instructions: string;
    ingredients: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    cost: number;
    tags: string;
    rating: number;
}

interface MealLibraryProps {
    initialMeals: any[];
}

export default function MealLibrary({ initialMeals }: MealLibraryProps) {
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedMeal, setSelectedMeal] = useState<any | null>(null);

    const filters = ["All", "Lunch", "Dinner", "Beef", "Chicken", "Rice", "No Starch", "Italian", "Keto-Friendly", "Carb-Cycling"];

    const filteredMeals = initialMeals.filter((meal) => {
        const matchesSearch = meal.name.toLowerCase().includes(search.toLowerCase()) ||
            meal.tags.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter === "All" || meal.tags.includes(activeFilter);
        return matchesSearch && matchesFilter;
    });

    return (
        <div>
            {/* Search and Filters */}
            <div style={{ marginBottom: "2rem" }}>
                <input
                    type="text"
                    placeholder="Search meals or ingredients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "1.1rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        boxShadow: "var(--shadow-sm)",
                        marginBottom: "1rem"
                    }}
                />

                <div style={{
                    display: "flex",
                    gap: "0.75rem",
                    overflowX: "auto",
                    paddingBottom: "1rem",
                    scrollbarWidth: "none"
                }}>
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={activeFilter === filter ? "btn-primary" : "btn-secondary"}
                            style={{ flexShrink: 0 }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Meal Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "2rem"
            }}>
                {filteredMeals.map((meal) => (
                    <div key={meal.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ marginBottom: "1rem" }}>
                            <span style={{
                                fontSize: "0.8rem",
                                backgroundColor: "var(--surface-secondary)",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--primary)",
                                fontWeight: "600"
                            }}>
                                R{meal.cost.toFixed(2)}
                            </span>
                        </div>

                        <h3 style={{ marginBottom: "0.5rem" }}>{meal.name}</h3>

                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            color: "gray",
                            marginBottom: "1rem",
                            borderTop: "1px solid var(--border-light)",
                            paddingTop: "0.5rem"
                        }}>
                            <span>{meal.calories} kcal</span>
                            <span>Prot: {meal.protein}g</span>
                            <span>Carb: {meal.carbs}g</span>
                            <span>Fat: {meal.fats}g</span>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                            {meal.tags.split(",").map((tag: string) => (
                                <span key={tag} style={{
                                    fontSize: "0.75rem",
                                    color: "var(--foreground)",
                                    opacity: 0.7
                                }}>
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => setSelectedMeal(meal)}
                            className="btn-secondary"
                            style={{ marginTop: "auto", width: "100%" }}
                        >
                            View Details
                        </button>
                    </div>
                ))}
            </div>

            {selectedMeal && (
                <MealDetail
                    meal={selectedMeal}
                    onClose={() => setSelectedMeal(null)}
                />
            )}
        </div>
    );
}
