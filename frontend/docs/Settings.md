# Documentation for Project Settings

This document provides a detailed explanation of the key configuration files used in the project. Each file serves a specific purpose in the development workflow, ensuring efficient builds, consistent coding styles, and proper linting.

---

## `package.json`

### Purpose

The `package.json` file is the core of the project’s metadata and dependency management. It defines scripts, dependencies, and project information.

### Key Sections

- **`scripts`**:
  - `dev`: Starts Rollup in watch mode with live reloading.
  - `build`: Builds the project for production using Rollup.
  - `format`: Formats JavaScript files using Prettier.
  - `test`: Placeholder for running tests.
- **`devDependencies`**: Tools required during development, like Rollup plugins, ESLint, Prettier, and SWC.
- **`dependencies`**: Libraries required at runtime, like Bootstrap and Popper.js.

### Usage

Run commands like `npm run dev` or `npm run build` to execute the respective scripts.

---

## `rollup.config.mjs`

### Purpose

Defines the configuration for Rollup, the module bundler used to compile the project’s files into a single bundle.

### Key Configuration

- **`input`**: Entry point of the application (`src/main.js`).
- **`output`**: Bundling output file (`dist/bundle.js`) in ES module format with sourcemaps.
- **`plugins`**:
  - **Alias**: Custom path aliases for easier imports.
  - **Resolve & CommonJS**: Enables Rollup to work with Node.js-style imports and CommonJS modules.
  - **PostCSS**: Processes and bundles CSS files, including support for imports and minification.
  - **SWC**: Transpiles JavaScript to modern standards.
  - **Copy**: Copies static assets (HTML, icons, images, fonts) to the `dist` directory.
  - **Dev & Livereload**: Provides a development server and live reloading in development mode.
  - **Terser**: Minifies JavaScript for production builds.
- **Environment-Specific Behavior**:
  - Development (`ROLLUP_WATCH=true`): Includes live reloading and development server.
  - Production: Optimized build with minification.

---

## `eslint.config.mjs`

### Purpose

Configures ESLint for code linting, ensuring code quality and adherence to best practices.

### Key Configuration

- **Globals**: Enables browser-specific global variables.
- **Plugins**: Includes the Prettier plugin to integrate formatting checks directly into ESLint.
- **Rules**:
  - Enforces Prettier formatting.
  - Warns about unused variables.
  - Disables console warnings.

### Usage

Run ESLint using `npx eslint .` to lint the project files.

---

## `.swcrc`

### Purpose

Configuration for SWC, a fast JavaScript compiler used for transpiling code.

### Key Configuration

- **`parser.syntax`**: Uses ECMAScript syntax.
- **`target`**: Transpiles code to ES2021.
- **`module.type`**: Outputs ES6 modules.

### Usage

This configuration is referenced by the Rollup SWC plugin for efficient JavaScript compilation.

---

## `.prettierrc`

### Purpose

Defines Prettier's code formatting rules to maintain a consistent style across the project.

### Key Configuration

- **`semi`**: Enforces semicolons at the end of statements.
- **`singleQuote`**: Prefers single quotes over double quotes.
- **`trailingComma`**: Adds trailing commas where valid in ES5.
- **`printWidth`**: Wraps lines exceeding 80 characters.
- **`tabWidth`**: Sets tab width to 2 spaces.

### Usage

Run `npm run format` to format code based on these rules.

---

## `.prettierignore`

### Purpose

Lists files and directories that should be ignored by Prettier during formatting.

### Ignored Paths

- **`/dist`**: The output directory for the build.
- **`node_modules`**: External dependencies.

---

## Summary of Tools and Their Purpose

| Tool/File           | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `package.json`      | Project metadata, dependencies, and scripts.    |
| `rollup.config.mjs` | Bundles and optimizes the project files.        |
| `eslint.config.mjs` | Lints code to enforce best practices.           |
| `.swcrc`            | Transpiles code to modern JavaScript standards. |
| `.prettierrc`       | Enforces consistent code formatting.            |
| `.prettierignore`   | Excludes files from Prettier formatting.        |

---

## Why These Files Are Necessary

1. **Efficient Builds**: Rollup ensures a modular and optimized build process.
2. **Code Quality**: ESLint and Prettier maintain consistent and clean code.
3. **Modern JavaScript**: SWC enables the use of modern syntax while supporting older environments.
4. **Streamlined Workflow**: Scripts and tools automate repetitive tasks like formatting and bundling.
5. **Clear Project Structure**: Configuration files define clear rules and structure for collaboration.
