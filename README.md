# Vibrant Impact: Sacred Geometry Poster Generator

A specialized web application designed for graphic designers and spiritual enthusiasts to generate high-frequency posters. This project serves as a technical deep-dive into **Serverless Functions**, **DOM Manipulation**, and **Secure API Integration**.

## 🚀 [Launch Live App (Vercel)](https://vibrant-impact-poster-generator.vercel.app/)

---

## 🛠️ The Technical Stack
This app was architected to bridge the gap between frontend design and secure backend logic.

* **Frontend:** HTML5, CSS Grid (for complex control panels), and Vanilla JavaScript (ES6+).
* **Backend:** Node.js Serverless Functions (Vercel Functions) to handle secure API requests.
* **API Integration:** Dynamic data fetching from the ZenQuotes API.
* **State Management:** Utilizes **LocalStorage** to persist user-generated "Intentions" and canvas configurations across sessions.

---

## 🔐 Security & Architecture (The "Senior" Move)
To protect sensitive credentials while keeping the repository public, I implemented a **Serverless Proxy Architecture**:

1.  **Environment Variables:** API keys are never stored in the source code. They are injected into the production environment via **Vercel Environment Variables**.
2.  **Serverless Middleware:** Instead of the browser calling the API directly (which would expose the key), the frontend calls a secure **Vercel Function** (`/api/quotes`).
3.  **Encapsulation:** The API key is appended to the request on the server side, ensuring that the "Secret" remains hidden from the client-side Inspect Element tool.

---

## 📐 Key Coding Standards
* **camelCase Discipline:** All JavaScript variables, function names, and file paths follow strict camelCase naming conventions for professional readability.
* **Grid-First Layout:** The generator interface was built entirely with **CSS Grid** to handle the complex, two-dimensional alignment of generator controls and the preview canvas.
* **Asynchronous Logic:** Implemented `async/await` patterns with robust error handling for a seamless user experience during data fetching.

---

## 🎓 Portfolio Context
This project is a cornerstone of my **2027 Internship Strategy**. It demonstrates my transition from a Graphic Designer to a **Creative Developer** who can build functional, secure, and aesthetically superior digital tools.

---
**Designed & Coded by Stephanie Otteson** *Graphic Design Graduate | Coding Student | AI Enthusiast*
