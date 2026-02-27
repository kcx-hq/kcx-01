# Deployment Guide for Render

This guide will help you deploy the master-001 project to Render.

## Prerequisites

1. A [Render](https://render.com) account (sign up for free)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A PostgreSQL database (you can use Render's free PostgreSQL or an external provider like Supabase)

## Deployment Steps

### Option 1: Deploy Using Blueprint (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Blueprint"

3. **Connect Your Repository**
   - Select your repository
   - Render will automatically detect the `render.yaml` file

4. **Configure Environment Variables**
   
   **For Backend Service:**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - A random secret key (generate with `openssl rand -base64 32`)
   - `FRONTEND_URL` - Will be: `https://master-001-frontend.onrender.com`
   - Add other API keys as needed (Mailgun, Google, Zoom, Groq, etc.)

   **For Frontend Service:**
   - `VITE_API_URL` - Will be: `https://master-001-backend.onrender.com`
   - `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk key (if using Clerk auth)

5. **Deploy**
   - Click "Apply"
   - Render will create both services and start deployment

### Option 2: Manual Deployment

#### Step 1: Create Backend Service

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `master-001-backend`
   - **Root Directory**: Leave blank
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm run start:release`
   - **Plan**: Free (or choose paid plan)

4. Add Environment Variables (click "Advanced"):
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = Your PostgreSQL URL
   - `JWT_SECRET` = Your secret key
   - Add other required variables

5. Click "Create Web Service"

#### Backend Release Step (Required)

Run migrations before serving traffic:

```bash
cd backend
npm run db:migrate
```

`npm run start:release` executes `db:migrate` before `start` to prevent runtime schema drift.

#### Step 2: Create Frontend Service

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: `master-001-frontend`
   - **Root Directory**: Leave blank
   - **Branch**: `main`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `./frontend/dist`

4. Add Environment Variables:
   - `VITE_API_URL` = `https://master-001-backend.onrender.com` (use your backend URL)

5. Click "Create Static Site"

#### Step 3: Update CORS and URLs

After deployment, you'll receive URLs like:
- Backend: `https://master-001-backend.onrender.com`
- Frontend: `https://master-001-frontend.onrender.com`

Update the backend service environment variables:
- Set `FRONTEND_URL` to your actual frontend URL

### Setting Up PostgreSQL Database

#### Option A: Use Render's PostgreSQL (Free Tier Available)

1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `master-001-db`
   - **Database**: `master001`
   - **User**: `master001user`
   - **Region**: Same as your backend
   - **Plan**: Free or Paid

3. After creation, copy the "External Database URL"
4. Add it to your backend's `DATABASE_URL` environment variable

#### Option B: Use External Database (Supabase, AWS RDS, etc.)

1. Create a PostgreSQL database with your provider
2. Get the connection string
3. Add it to your backend's `DATABASE_URL` environment variable

## Post-Deployment

### Verify Deployment

1. **Check Backend**
   - Visit: `https://your-backend-url.onrender.com/api/auth/health`
   - Should return a success response

2. **Check Frontend**
   - Visit: `https://your-frontend-url.onrender.com`
   - Should load the application

### Common Issues

1. **Build Fails**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `dependencies` (not `devDependencies`)

2. **Database Connection Fails**
   - Verify `DATABASE_URL` is correct
   - Check if database allows connections from Render's IP

3. **CORS Errors**
   - Verify `FRONTEND_URL` environment variable matches your frontend URL
   - Check backend logs for CORS-related messages

4. **Frontend Can't Connect to Backend**
   - Verify `VITE_API_URL` is set correctly
   - Check network tab in browser DevTools

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month free (shared across services)
- Limited build minutes

## Custom Domains (Optional)

To use custom domains:

1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed

## Environment Variable Updates

When you need to update environment variables:

1. Go to service dashboard
2. Click "Environment"
3. Update variables
4. Click "Save Changes"
5. Service will redeploy automatically

## Monitoring

- **Logs**: Available in each service dashboard
- **Metrics**: CPU, memory usage in dashboard
- **Alerts**: Set up in Render settings

## Scaling

To upgrade from free tier:
1. Go to service settings
2. Change plan type
3. Confirm billing

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Render Static Site Guide](https://render.com/docs/deploy-static-site)

---

**Note**: The service names in `render.yaml` (`master-001-backend`, `master-001-frontend`) can be customized to match your preferences. Just ensure the URLs are updated accordingly in the environment variables.
