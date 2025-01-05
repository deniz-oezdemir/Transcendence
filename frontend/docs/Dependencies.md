# Fronted Dependencies Documentation

This document outlines the dependencies installed in the frontend and their purposes. It serves as a reference for understanding the technologies and tools used so far.

---

## **Installed Development Dependencies**

### **1. Rollup**

- **Package**: `rollup`
- **Purpose**: Rollup is used as the module bundler for this project. It helps bundle JavaScript files into a single file for the browser, ensuring better performance and compatibility.

### **2. Rollup Plugins**

- **`@rollup/plugin-node-resolve`**

  - **Purpose**: Allows Rollup to locate and bundle dependencies from `node_modules`.

- **`@rollup/plugin-commonjs`**

  - **Purpose**: Converts CommonJS modules to ES modules, allowing them to be included in the Rollup bundle.

- **`@rollup/plugin-html`**

  - **Purpose**: Automatically generates an HTML file for the project, injecting the bundled script and other assets.

- **`rollup-plugin-serve`**

  - **Purpose**: Provides a development server to serve the files locally, enabling hot-reloading during development.

- **`rollup-plugin-livereload`**

  - **Purpose**: Adds live-reloading capabilities, ensuring the browser refreshes automatically whenever files are modified.

- **`rollup-plugin-copy`**
  - **Purpose**: Copies static assets like `index.html` to the output directory, ensuring required files are available after bundling.

### **3. CSS Handling**

- **`postcss`**

  - **Purpose**: Processes CSS files, allowing transformations using plugins like autoprefixing or minification.

- **`postcss-modules`**

  - **Purpose**: Enables CSS Modules, allowing CSS class names to be scoped locally to avoid conflicts.

- **`rollup-plugin-postcss`**
  - **Purpose**: Enables Rollup to process CSS files and bundle them with JavaScript.

### **4. ESLint**

- **Package**: `eslint`
- **Purpose**: Ensures code quality and consistency by identifying and fixing linting issues during development.

- **`@eslint/js`**

  - **Purpose**: Provides JavaScript-specific linting rules for ESLint.

- **`eslint-config-prettier`**

  - **Purpose**: Disables conflicting ESLint rules when using Prettier.

- **`eslint-plugin-prettier`**
  - **Purpose**: Integrates Prettier into ESLint, allowing code to be formatted during linting.

### **5. Prettier**

- **Package**: `prettier`
- **Purpose**: Enforces consistent code formatting, making the codebase easier to read and maintain.

### **6. SWC**

- **Packages**: `@swc/core` and `@rollup/plugin-swc`
- **Purpose**: Replaces Babel for transpiling modern JavaScript (ES6+) to older versions for broader browser compatibility. SWC is faster and lightweight.

### **7. Globals**

- **Package**: `globals`
- **Purpose**: Provides a list of global variables for use in ESLint configurations.
