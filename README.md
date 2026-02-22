# 🥗 Food Crib

Food Crib is a premium, AI-powered meal planning and grocery management system designed specifically for families who want to stay healthy and keto/low-carb compliant while strictly managing a budget (optimized for South African Rand/ZAR).

## ✨ Key Features

### 🧠 1. AI Weekly Planner
* **Macro-Aware Generation**: Plans meals based on your current diet mode (Keto-Friendly or Carb-Cycling).
* **Budget Strategy**: Automatically prioritizes handmade versions of ingredients (e.g., mince instead of pre-made patties) to stay under the R400/day limit.
* **Bulk-Buying Optimization**: AI identifies bulk savings (20%+ discount) and plans 2-3 unique meals throughout the week to utilize the bulk ingredient and minimize waste.

### 🔎 2. AI Meal Discover (Researcher)
* **4-Variation Search**: Enter any craving (e.g., "Spaghetti Bolognaise") and get 4 AI-generated recipes:
    * **Budget Friendly**: Lowest cost version using bulk staples.
    * **Fast & Easy**: Hard cap of <15 mins active prep time.
    * **Gourmet Twist**: Elevated flavors and techniques.
    * **Food Crib Signature**: AI-optimized for Best Taste, Easy Prep, Healthy, and Weight-Loss balance.
* **Live Cost Estimates**: Every discovered recipe shows real-time South African Rand estimates based on your actual pantry prices.

### 🛠️ 3. Custom Menu Builder
* A specialized interface to manually build your week.
* Click a day/slot, select a meal from your library, and watch your total budget update in real-time.
* Instant saving to history for future reference.

### 🛒 4. Inventory & Cost Management
* **Bulk Import**: Paste messy grocery text (Woolworths, Checkers, etc.), and the AI extracts ingredients and prices automatically.
* **Auto-Recalculate**: A single button in any meal editor will update its total cost based on the latest prices in your database.
* **Missing Price Highlighting**: Visual badges and filtering for items that need pricing information.

### 🍳 5. Pantry Chef
* Tell the AI exactly what ingredients are left in your fridge, and it will generate a recipe that fits your diet and macro needs.

---

## 🛠️ Technology Stack
* **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
* **Database**: [SQLite](https://sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
* **AI Engine**: [OpenRouter API](https://openrouter.ai/) (GPT-4o / Claude 3.5 Sonnet)
* **Styling**: Vanilla CSS with a focused Glassmorphism design system.

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
   Create a `.env` file in the root directory:
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

## 🐳 Docker Deployment (Coming Soon)
The project includes a `docker-compose.yml` and `Dockerfile` currently in testing. 

**Current Status**: Implementation is in progress for production-ready containerization.
**Future Usage**:
```bash
docker-compose up --build
```

---

## 🥗 Diet Modes Explained
* **Carb-Cycling**: High carbs at lunch for energy, zero/low starch for dinner for fat loss.
* **Keto-Friendly**: High fat, moderate protein, near-zero carbs for all meals.

## 💶 Budget Rules
The application is hard-coded to optimize for South African pricing models, emphasizing the R400/day family limit (~R2,800/week for 2 adults and one 4nd-year-old).
