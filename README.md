# erlc.js Monorepo

Welcome to **erlc.js**, a modern, fully-typed, high-performance TypeScript/JavaScript monorepo for wrapping and interacting with the Roblox **Emergency Response: Liberty County (ER:LC)** private server API.

## Project Structure

This project is a monorepo managed with `pnpm` workspaces and `Turbo`:

*   **`packages/core`**: The core API wrapper library (`@erlcjs/core`). It handles rate limiting, request queuing, and caching of players, vehicles, commands, and logs. It conforms to Microsoft API Extractor guidelines for type exports.
*   **`apps/docs`**: An Astro Starlight project containing documentation, user guides, and dynamically generated API references.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [pnpm](https://pnpm.io/) (v10 or higher)

### Setup & Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/noinkin/erlcapi.git
    cd erlcapi
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

## Development and Building

We use Turborepo to coordinate builds and task runs across workspaces.

### Available Workspace Scripts

Run these from the root directory:

*   **Build the codebase**:
    ```bash
    pnpm run build
    ```
*   **Lint the codebase**:
    ```bash
    pnpm run lint
    ```
*   **Format code with Prettier**:
    ```bash
    pnpm run format
    ```
*   **Run Vitest tests**:
    ```bash
    pnpm run test
    ```
*   **Run documentation development server**:
    ```bash
    pnpm run docs:dev
    ```
*   **Build production documentation portal**:
    ```bash
    pnpm run docs:build
    ```
*   **Generate API Reference documentation**:
    ```bash
    pnpm run docs:generate
    ```
    *(Extracts JSDocs from core packages using `api-extractor` and builds markdown files inside the docs app using `api-documenter`)*

## Contributing

1.  Create a branch for your changes.
2.  Follow the existing JSDoc/TSDoc documenting standard.
3.  Add changesets before merging (`pnpm changeset`).
4.  Ensure all tests and linting check pass.