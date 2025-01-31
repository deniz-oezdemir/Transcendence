# Project Structure Documentation

This document outlines the structure of the project and provides details on the purpose and contents of each directory and file. The goal is to maintain a clear organization for scalability and maintainability.

---

## **Project Structure Overview**

```
├── dist/              # Bundled output for production
├── docs/              # Documentation files
├── node_modules/      # Installed dependencies
├── src/               # Main source code
│   ├── assets/        # Static assets (fonts, icons, images, styles)
│   │   ├── fonts/
│   │   ├── icons/
│   │   ├── images/
│   │   └── styles/
│   │       ├── global.css
│   │       ├── layout.css
│   │       └── reset.css
│   ├── components/    # UI components for reuse
│   ├── pages/         # Views for application routes
│   ├── core/         # Core SPA logic
│   │   ├── componentSystem.js
│   │   ├── reactivitySystem.js
│   │   ├── router.js
│   │   └── themeManager.js
│   ├── Layout.js      # Root layout component
│   ├── main.js        # Application entry point
│   └── index.html     # Root HTML template
├── .prettierrc        # Prettier configuration
├── .eslint.config.mjs # ESLint configuration
├── package.json       # Project metadata and dependencies
├── pnpm-lock.yaml     # Dependency lockfile for pnpm
└── rollup.config.mjs  # Rollup bundler configuration
```

---

## **Detailed Description**

### **1. `src/`**

This is the main directory for the source code. It contains all the files and logic for the application.

#### **`assets/`**

- **Purpose:** Stores static resources for the application.
- **Subdirectories:**
  - `fonts/`: Custom fonts used in the app.
  - `icons/`: SVG or icon font files.
  - `images/`: Application images.
  - `styles/`: Contains global CSS styles.
    - `global.css`: General styles applied across the app.
    - `layout.css`: Styles for layouts and grids.
    - `reset.css`: CSS reset to ensure consistent styling.

#### **`components/`**

- **Purpose:** Houses reusable UI components, such as buttons, cards, or modals.

#### **`pages/`**

- **Purpose:** Contains the views corresponding to the application’s routes. Each file represents a distinct route in the SPA.

#### \*`core/`

- **Purpose:** Provides the base functionality for the SPA. This includes core systems like routing, components, and theming.
- **Files:**
  - `componentSystem.js`: Manages dynamic component creation.
  - `reactivitySystem.js`: Provides reactive data binding logic.
  - `router.js`: Implements client-side routing logic.
  - `themeManager.js`: Handles light/dark theme management and system theme detection.

> **Suggestion:** Consider renaming this directory to `core/` to better reflect its role as the backbone of the SPA.

#### **`Layout.js`**

- **Purpose:** Defines the root layout component of the application, wrapping all pages with shared UI elements like headers or footers.

#### **`main.js`**

- **Purpose:** The entry point for the application. It initializes the router, theming, and mounts the application onto the DOM.
- **Key Logic:**
  - Imports core systems (`Router`, `createComponent`, `applyInitialTheme`, etc.).
  - Defines routes and middlewares for navigation.
  - Sets up nested layouts for specific sections, e.g., the admin section.
  - Mounts the router to the root HTML element.

#### **`index.html`**

- **Purpose:** The root HTML file that serves as the entry point for the SPA.

---

### **2. Configuration Files**

- **`.prettierrc`:** Configuration for Prettier to ensure consistent code formatting.
- **`.eslint.config.mjs`:** Configuration for ESLint to enforce coding standards and detect issues.
- **`rollup.config.mjs`:** Configures the Rollup bundler for building the project.
- **`pnpm-lock.yaml`:** Lockfile for dependencies managed by pnpm.
- **`package.json`:** Metadata for the project, including scripts and dependencies.

---

## **Entry Point: `main.js`**

Here is a summary of the logic in `main.js`:

- **Theme Management:**
  - `applyInitialTheme()`: Applies the initial theme based on system preferences or user settings.
  - `addSystemThemeListener()`: Listens for system theme changes and updates the app theme dynamically.
- **Routing:**
  - Sets up routes and middlewares.
  - Allows nested layouts, demonstrated with an admin section example.
- **Mounting:**
  - Attaches the SPA to the DOM element with ID `app`.

---
