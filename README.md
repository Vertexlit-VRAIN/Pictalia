# Adaptator - Adapted Worksheet Generator

This application helps create adapted educational worksheets. It uses a LLM to generate content and the Arasaac API for pictograms to provide visual support, making learning materials more accessible.

## Features

*   **Generate Worksheets:** Automatically create worksheets based on user-provided topics.
*   **AI-Powered:** Uses AI to generate educational content.
*   **Pictogram Support:** Integrates with Arasaac to include pictograms for better understanding.
*   **Editable Content:** Allows for editing and customization of the generated worksheets.
*   **PDF Export:** Export worksheets to PDF format.

## How to Run the Project

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd adaptator-(generador-de-fichas-adaptadas)
    ```

2.  **Install dependencies:**
    Make sure you have Node.js installed. Then, run the following command in the project root:
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add your Google Gemini API key:
    ```
    VITE_GEMINI_API_KEY=YOUR_API_KEY
    ```
    You can get an API key from [Google AI Studio](https://aistudio.google.com/).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Previews the production build locally.