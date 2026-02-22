# 🥗 Food Crib AI

Food Crib is a premium, AI-powered meal planning and grocery management system designed specifically for families who want to stay healthy and keto/low-carb compliant while strictly managing a budget (optimized for South African Rand/ZAR).

## ✨ Key Features

### 🧠 1. AI Weekly Planner
* **Neural Library Prioritization**: The AI strictly prioritizes your rated library meals before generating new ones.
* **Lunch & Dinner Focus**: Streamlined planning focusing on the two main family meals.
* **Consolidated Shopping Manifest**: Automatically generates a unified "Logistics Manifest" for the entire week with estimated costs.
* **Interactive Meal Dossiers**: Every generated meal is clickable, revealing detailed ingredients and a numbered Execution Protocol.

### 🔎 2. AI Meal Discover (Researcher)
* **4-Variation Search**: Enter any craving and get 4 AI-generated recipes:
    * **Budget Friendly**: Lowest cost version using bulk staples.
    * **Fast & Easy**: Hard cap of <15 mins active prep time.
    * **Gourmet Twist**: Elevated flavors and techniques.
    * **Food Crib Signature**: AI-optimized for Best Taste, Easy Prep, Healthy, and Macro-balance.

### 🛠️ 3. Interactive Management
* **Real-Time Plan Editing**: Remove specific meals from your plan to create vacancies.
* **Archive Intelligence**: View instructions, ingredients, and shopping lists for any past deployment.
* **Meal Rating System**: Rate meals to help the AI prioritize your favorites.

### 🛡️ 4. AI Resilience System
* **3-Layer Fallback**: Automated fail-over between multiple free AI models (Gemma 3, Trinity, Qwen) ensures 24/7 availability.
* **Smart Timeouts**: 40-second per-provider timeouts prevent system hangs.
* **Detailed Mission Status**: Real-time status updates during AI generation.

### 🛒 5. Inventory & Cost Management
* **Bulk Import**: Paste grocery text from Woolworths or Checkers, and the AI extracts data automatically.
* **Auto-Recalculate**: Update all meal costs instantly from your ingredient database.
* **AI Price Estimation**: Automatically estimates prices for unknown ingredients.
* **Smart Substitutions**: Matches similar ingredients when exact prices aren't available.

### 🖨️ 6. Shopping List Export
* **Print/PDF**: Clean printable format with item, quantity, and cost.
* **Text Export**: Aligned text file for easy reading.
* **Accurate Totals**: Real-time cost calculation based on actual recipe ingredients.

---

## 🛠️ Technology Stack
* **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
* **Database**: [SQLite](https://sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
* **AI Engine**: [OpenRouter API](https://openrouter.ai/) (Gemma 3, Trinity Mini, Qwen 3)
* **Resilience**: Custom AbortController-based timeout & fallback logic.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* An OpenRouter API Key

### Installation & Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/pippen777/foodprep.git
   cd foodprep
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENROUTER_API_KEY="your_key_here"
   ```

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the App**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

---

## 🥗 Family Portions
Recipes are automatically scaled for **2 adults + 1 child (age 4)**:
* Adult protein: 150-200g per person
* Child portion: 75-100g
* Total serves 2.5 people

## 📏 Measurements
All recipes use **South African metric units** (grams, kg, ml, litres, Celsius). Use the "Convert Measurements" tool to update existing recipes.

## 💶 Budget Rules
Optimized for South African pricing models, targeting a R400/day family limit (~R2,800/week) including bulk-buying intelligence.
