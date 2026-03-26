# ForexFlow Production Deployment Guide

This guide covers everything required to deploy the ForexFlow platform live. The backend will be hosted on **Render** (as a Node.js API) and the frontend on **Vercel** (as a React application).

---

## 🚀 1. Pushing to GitHub

Because this is a completely fresh repository with a clean history and a `.gitignore` to protect your secrets and SQLite database, your first step is pushing the project online.

1. Go to [GitHub](https://github.com/new) and create a new repository called `forexflow`. Do not add a README, license, or gitignore template.
2. Open your terminal in the root directory of your project (`/Users/arpittripathi/forex_calculator`).
3. Run the following commands to link your local code to your new remote GitHub repo:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/forexflow.git
git branch -M main
git push -u origin main
```

*(Assuming your code is already committed locally. If not, follow step 4 below).*

---

## ⚙️ 2. Deploying the Node.js Backend (Render)

Render is perfect for hosting your Express and SQLite backend because you can configure block storage if needed to persist your `.sqlite` database across deployments.

1. **Sign up/Log in** to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub account and select your `forexflow` repository.
4. **Configuration**:
   - **Name**: `forexflow-api`
   - **Root Directory**: `forexflow-backend` *(Very Important!)*
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node src/server.js`)
5. **Environment Variables**:
   Under the "Environment" tab, add the variables from your backend `.env` file:
   - `PORT`: `3001` (Render will override this, but good practice).
   - `JWT_SECRET`: Generate a strong random string (e.g., `o2rF987Xq1...`)
   - `TWELVEDATA_API_KEY`: `9bb271536e0c4ab8a7b0d45d752007fd`
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will begin deploying your backend.
7. **Note on SQLite Persistence**: On Render's free tier, the `.sqlite` database gets wiped on every rebuild. For persistence, consider Render's "Disk" feature (requires paid tier) or migrate the SQLite database to a managed PostgreSQL cluster natively in Render.

---

## 🌐 3. Deploying the React Frontend (Vercel)

Vercel is fully optimized for React and Vite. It will build and serve your frontend extremely fast over an edge CDN.

1. **Sign up/Log in** to [Vercel](https://vercel.com/).
2. Click **Add New Project**.
3. Import your `forexflow` repository from your GitHub connection.
4. **Configuration Step**:
   - Vercel automatically detects the Framework Preset as **Vite**.
   - **Root Directory**: `forexflow-frontend` *(Very Important! Click "Edit" and choose the frontend folder!)*
   - **Build Settings**: (Leaves as default: `npm run build` and `dist` output).
5. **Environment Variables**:
   You must point the production React frontend to the new live Render backend URL.
   Add the following variable:
   - `VITE_API_URL`: `https://forexflow-api.onrender.com` *(Replace this with whatever Render URL you got from Step 2 above)*.
6. Click **Deploy**. Vercel will build the frontend, automatically bundling the environment variables into the React static files.

---

## ✅ 4. Final Validation

Once both services turn **Green** (Live), open the Vercel URL in your browser.

- You should see the dashboard load and immediately start pulling prices via TwelveData.
- If trading fails, check typical browser DevTools (Network tab) to ensure your `VITE_API_URL` requests are correctly reaching Render without CORS failures.
