"use client";

import { useState } from "react";
import { saveMeal, deleteMeal } from "@/app/actions/meals";
import { updateIngredient, deleteIngredient } from "@/app/actions/ingredients";

interface InventoryClientProps {
    initialMeals: any[];
    initialIngredients: any[];
}

export default function InventoryClient({ initialMeals, initialIngredients }: InventoryClientProps) {
    const [activeTab, setActiveTab] = useState<"recipes" | "ingredients">("recipes");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [meals, setMeals] = useState(initialMeals);
    const [ingredients, setIngredients] = useState(initialIngredients);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const handleEditMeal = (meal: any) => {
        setEditingId(meal.id);
        setEditForm({ ...meal });
    };

    const handleEditIngredient = (ing: any) => {
        setEditingId(ing.id);
        setEditForm({ ...ing });
    };

    const handleSaveMeal = async () => {
        await saveMeal(editForm);
        setMeals(meals.map(m => m.id === editForm.id ? editForm : m));
        setEditingId(null);
    };

    const handleSaveIngredient = async () => {
        await updateIngredient(editingId!, editForm);
        setIngredients(ingredients.map(i => i.id === editingId ? editForm : i));
        setEditingId(null);
    };

    const handleDeleteMeal = async (id: string) => {
        if (confirm("Delete this recipe?")) {
            await deleteMeal(id);
            setMeals(meals.filter(m => m.id !== id));
        }
    };

    const handleDeleteIngredient = async (id: string) => {
        if (confirm("Delete this ingredient?")) {
            await deleteIngredient(id);
            setIngredients(ingredients.filter(i => i.id !== id));
        }
    };

    let filteredMeals = meals.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tags && m.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    let filteredIngredients = ingredients.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.tags && i.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (showMissingOnly) {
        filteredMeals = filteredMeals.filter(m => m.cost === 0);
        filteredIngredients = filteredIngredients.filter(i => i.price === 0);
    }

    return (
        <div>
            <div style={{ marginBottom: "2rem", maxWidth: "600px", margin: "0 auto 2rem auto", display: "flex", gap: "1rem" }}>
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'recipes' ? 'recipes...' : 'ingredients...'}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        padding: "1rem 1.5rem",
                        fontSize: "1.1rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        boxShadow: "var(--shadow-sm)",
                        outline: "none"
                    }}
                />
                <button
                    onClick={() => setShowMissingOnly(!showMissingOnly)}
                    className={showMissingOnly ? "btn-primary" : "btn-secondary"}
                    style={{
                        whiteSpace: "nowrap",
                        backgroundColor: showMissingOnly ? "var(--error)" : undefined,
                        borderColor: showMissingOnly ? "var(--error)" : undefined
                    }}
                >
                    {showMissingOnly ? "Show All" : "Missing Prices"}
                </button>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", justifyContent: "center" }}>
                <button
                    onClick={() => { setActiveTab("recipes"); setEditingId(null); setSearchQuery(""); }}
                    className={activeTab === "recipes" ? "btn-primary" : "btn-secondary"}
                >
                    Recipes ({filteredMeals.length})
                </button>
                <button
                    onClick={() => { setActiveTab("ingredients"); setEditingId(null); setSearchQuery(""); }}
                    className={activeTab === "ingredients" ? "btn-primary" : "btn-secondary"}
                >
                    Ingredients ({filteredIngredients.length})
                </button>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem"
            }}>
                {(activeTab === "recipes" ? filteredMeals : filteredIngredients).map((item) => {
                    const isMissingPrice = activeTab === "recipes" ? item.cost === 0 : item.price === 0;

                    return (
                        <div key={item.id} className="card" style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: editingId === item.id ? "350px" : "auto",
                            border: editingId === item.id
                                ? "2px solid var(--primary-hover)"
                                : isMissingPrice
                                    ? "2px solid var(--error-light)"
                                    : "1px solid var(--border-light)",
                            backgroundColor: isMissingPrice && !editingId ? "rgba(255, 59, 48, 0.02)" : undefined
                        }}>
                            {editingId === item.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", height: "100%" }}>
                                    <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--primary)" }}>NAME</label>
                                    <input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                                    />

                                    {activeTab === "ingredients" && (
                                        <>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>PRICE</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.price}
                                                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>UNIT</label>
                                                    <input
                                                        value={editForm.unit}
                                                        onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>TAGS</label>
                                    <input
                                        placeholder="Comma separated"
                                        value={editForm.tags || ""}
                                        onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "auto" }}
                                    />

                                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                                        <button onClick={activeTab === "recipes" ? handleSaveMeal : handleSaveIngredient} className="btn-primary" style={{ flex: 1 }}>Save</button>
                                        <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                {isMissingPrice && (
                                                    <span style={{
                                                        fontSize: "0.65rem",
                                                        fontWeight: "800",
                                                        color: "white",
                                                        backgroundColor: "var(--error)",
                                                        padding: "0.1rem 0.4rem",
                                                        borderRadius: "4px",
                                                        width: "fit-content"
                                                    }}>
                                                        MISSING PRICE
                                                    </span>
                                                )}
                                                <h3 style={{ margin: 0, fontSize: "1.2rem", lineHeight: "1.2" }}>{item.name}</h3>
                                            </div>
                                            <button onClick={() => activeTab === "recipes" ? handleDeleteMeal(item.id) : handleDeleteIngredient(item.id)} style={{ opacity: 0.4, border: "none", background: "none", cursor: "pointer" }}>🗑️</button>
                                        </div>

                                        {activeTab === "ingredients" && (
                                            <div style={{
                                                fontSize: "1.1rem",
                                                fontWeight: "600",
                                                color: isMissingPrice ? "var(--error)" : "var(--primary)",
                                                marginBottom: "0.5rem"
                                            }}>
                                                {isMissingPrice ? "Price Unknown" : `R${item.price.toFixed(2)} / ${item.unit}`}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                                            {item.tags ? item.tags.split(",").map((tag: string, i: number) => (
                                                <span key={i} style={{
                                                    fontSize: "0.7rem",
                                                    backgroundColor: "var(--surface-secondary)",
                                                    padding: "0.2rem 0.5rem",
                                                    borderRadius: "10px",
                                                    color: "gray",
                                                    border: "1px solid var(--border-light)"
                                                }}>
                                                    {tag.trim()}
                                                </span>
                                            )) : (
                                                <span style={{ fontSize: "0.7rem", color: "#ccc", fontStyle: "italic" }}>No tags</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => activeTab === "recipes" ? handleEditMeal(item) : handleEditIngredient(item)}
                                        className="btn-secondary"
                                        style={{
                                            marginTop: "1.5rem",
                                            width: "100%",
                                            fontSize: "0.85rem",
                                            padding: "0.6rem",
                                            border: isMissingPrice ? "1px solid var(--error-light)" : undefined,
                                            color: isMissingPrice ? "var(--error)" : undefined
                                        }}
                                    >
                                        {isMissingPrice ? "Add Pricing" : "Edit Meta"}
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {(activeTab === "recipes" ? filteredMeals : filteredIngredients).length === 0 && (
                <div style={{ textAlign: "center", padding: "5rem", color: "gray" }}>
                    No {activeTab} found matching "{searchQuery}"
                </div>
            )}
        </div>
    );
}
