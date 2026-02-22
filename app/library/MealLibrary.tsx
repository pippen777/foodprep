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
        <div style={{ padding: "1rem" }}>
            {/* Search and Filters */}
            <div style={{ marginBottom: "3rem" }}>
                <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search your culinary archives..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "1.25rem 1rem 1.25rem 3rem",
                            fontSize: "1.1rem"
                        }}
                    />
                </div>

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
                            style={{
                                flexShrink: 0,
                                padding: "0.6rem 1.5rem",
                                fontSize: "0.85rem",
                                border: activeFilter === filter ? "none" : "1px solid rgba(255,255,255,0.1)"
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Meal Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "2.5rem"
            }}>
                {filteredMeals.map((meal) => (
                    <div key={meal.id} className="glass-card" style={{ display: "flex", flexDirection: "column", padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                            <span style={{
                                fontSize: "0.9rem",
                                background: "rgba(59, 130, 246, 0.1)",
                                padding: "0.4rem 0.8rem",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--primary)",
                                fontWeight: "800",
                                border: "1px solid rgba(59, 130, 246, 0.2)"
                            }}>
                                R{meal.cost.toFixed(2)}
                            </span>
                            <div style={{ color: "var(--warning)", fontSize: "1rem" }}>
                                {"★".repeat(meal.rating || 0)}{"☆".repeat(5 - (meal.rating || 0))}
                            </div>
                        </div>

                        <h3 style={{ marginBottom: "1rem", fontSize: "1.4rem", lineHeight: "1.2" }}>{meal.name}</h3>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.75rem",
                            fontSize: "0.8rem",
                            color: "rgba(255,255,255,0.85)",
                            marginBottom: "1.5rem",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            paddingTop: "1rem"
                        }}>
                            <div>🔥 {meal.calories} kcal</div>
                            <div>💪 Prot: {meal.protein}g</div>
                            <div>🍞 Carb: {meal.carbs}g</div>
                            <div>🥑 Fat: {meal.fats}g</div>
                        </div>

                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                            {meal.tags.split(",").map((tag: string) => (
                                <span key={tag} style={{
                                    fontSize: "0.7rem",
                                    color: "var(--accent)",
                                    background: "rgba(6, 182, 212, 0.05)",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "var(--radius-full)",
                                    border: "1px solid rgba(6, 182, 212, 0.1)"
                                }}>
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => setSelectedMeal(meal)}
                            className="btn-secondary"
                            style={{ marginTop: "auto", width: "100%", fontSize: "0.9rem" }}
                        >
                            Open Dossier
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
