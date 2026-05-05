# Product Requirements Document (PRD): Farmer Hand

## 1. Project Overview
**Project Name:** Farmer Hand (शेतकरी मदतनीस)
**Tagline:** Empowering the Farmers that Feed.
**Vision:** To bridge the gap between traditional farming and modern data science by providing farmers with accessible, AI-driven soil intelligence and financial planning tools.

---

## 2. Target Audience
*   **Primary:** Small to medium-scale Indian farmers.
*   **Secondary:** Agricultural consultants, students, and organic farming enthusiasts.
*   **Languages:** English and Marathi (to ensure regional accessibility).

---

## 3. Key Features

### 3.1 AI Soil Analysis
*   **Input Parameters:** pH Level, Nitrogen (N), Phosphorus (P), Potassium (K), Soil Typology (e.g., Red, Clay), and Region.
*   **AI Engine:** Powered by Google Gemini to analyze chemical composition and provide "Human-readable" explanations of soil health.
*   **Outcome:** A descriptive analysis and a list of recommended crops suited for that specific land.

### 3.2 Crop Lifecycle & Costing
*   **Lifecycle Stages:** Detailed guides for Land Preparation, Sowing, Irrigation, Fertilization, and Harvesting.
*   **Financial Estimation:** Real-time cost estimates in **Indian Rupee (INR)** for seeds, nutrients, water, and labor per acre.
*   **Visual Progress:** Interactive UI showing cost distribution and maintenance intensity.

### 3.3 Farmer Intelligence Guide (Education)
*   **Purpose:** Educate users on the "Why" and "When" of soil testing.
*   **Frequency Guidance:** Recommendations on testing intervals (annual/seasonal).
*   **Post-Test Strategy:** Steps for nutrient optimization and pH balancing.

### 3.4 Historical Records (Archive)
*   **Functionality:** Automatic saving of analysis results to local storage.
*   **Persistence:** Allows farmers to track soil health trends over multiple seasons.

---

## 4. Technical Specifications
*   **Frontend:** React 18+ with Vite (High-performance SPA).
*   **Styling:** Tailwind CSS (Custom "Farmer-Modern" aesthetic with heavy typography and earth tones).
*   **Animations:** Framer Motion (State transitions and entrance effects).
*   **AI Integration:** Google Generative AI (Gemini 1.5 Flash) for analysis and content generation.
*   **Icons:** Lucide-React.
*   **Typography:** Playfair Display (Serif) and Inter (Sans-serif) for high legibility and premium feel.

---

## 5. Design Philosophy
*   **Bold & High Contrast:** Increased font weights and darker ink colors (as requested) to ensure visibility in outdoor/bright light conditions.
*   **Bento-Grid Layout:** Organized information modules for complex data (like lifecycle and costs).
*   **Analog Print Aesthetic:** Inspired by high-end agricultural journals and land reports.

---

## 6. Future Roadmap
*   **Satellite Grounding:** Integration with real-time weather and satellite soil moisture maps.
*   **Market Price Integration:** Connecting crop recommendations to current APMC (Market) rates.
*   **Fertilizer Calculator Pro:** Precise dosage calculator based on specific brand availability in India.
