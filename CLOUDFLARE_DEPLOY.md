# Deploying to Cloudflare Pages

This guide explains how to deploy your Choir Learning Plan application to Cloudflare Pages.

## Prerequisites

1.  A [Cloudflare account](https://dash.cloudflare.com/sign-up).
2.  Your project code pushed to a GitHub repository (Recommended) OR a local build of your project.

## Method 1: Git Integration (Recommended)

This method automatically deploys your site whenever you push changes to GitHub.

1.  **Push your code to GitHub**:
    *   Create a new repository on GitHub.
    *   Push your local project to this repository.

2.  **Connect Cloudflare Pages**:
    *   Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
    *   Go to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
    *   Select your GitHub repository.

3.  **Configure Build Settings**:
    *   **Project Name**: `choir-learning-plan` (or your preferred name).
    *   **Production Branch**: `main` (or `master`).
    *   **Framework Preset**: Select **Vite**.
    *   **Build Command**: `npm run build`
    *   **Build Output Directory**: `dist`

4.  **Deploy**:
    *   Click **Save and Deploy**.
    *   Cloudflare will build your project and deploy it. You will get a unique URL (e.g., `choir-learning-plan.pages.dev`).

## Method 2: Direct Upload

If you don't want to use Git, you can upload the built files directly.

1.  **Build the Project Locally**:
    Open your terminal in the project folder and run:
    ```bash
    npm run build
    ```
    This creates a `dist` folder with your production-ready website.

2.  **Upload to Cloudflare**:
    *   Go to **Workers & Pages** > **Create Application** > **Pages** > **Upload Assets**.
    *   Name your project.
    *   Drag and drop the **contents** of the `dist` folder (not the folder itself, but the files inside it) into the upload area.
    *   Click **Deploy Site**.

## Important Note on Routing

A `_redirects` file has been added to your `public` folder. This ensures that if you add multiple pages (routing) in the future, refreshing the page won't cause a 404 error by redirecting all requests to `index.html`.
