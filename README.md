# Alpha Business Designs - Customer Review System

## Project Overview

A comprehensive customer review management system built with modern web technologies.

## How to run this project locally

Clone this repository and follow these steps:

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How to deploy this project

This project can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

### Build for production

```sh
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel

```sh
npx vercel --prod
```

### Deploy to Netlify

```sh
npx netlify deploy --prod --dir=dist
```

## Features

- Customer review collection system
- Email integration with embedded forms
- PWA support for mobile devices
- Responsive design with Tailwind CSS
- Type-safe development with TypeScript
