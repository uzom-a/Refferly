# Render Deployment Guide for TrustNet

## Database Setup

Your Render PostgreSQL database is configured:
- **Service ID**: `dpg-d4n2vdje5dus738pqf80-a`
- **Hostname**: `dpg-d4n2vdje5dus738pqf80-a`

## Step 1: Get Database URLs from Render

1. Go to your Render Dashboard
2. Open your PostgreSQL database service
3. Copy two URLs:
   - **Internal Database URL** (for Render services) - starts with `postgresql://`
   - **External Database URL** (for local development) - also starts with `postgresql://`

## Step 2: Set Up Local Development

1. Create `.env` file in the `web` directory:
   ```env
   DATABASE_URL="<paste-external-database-url-here>"
   ```

2. Generate Prisma Client:
   ```bash
   cd web
   npm run prisma:generate
   ```

3. Create and apply initial migration:
   ```bash
   npm run prisma:migrate
   ```
   When prompted, name it: `init_postgres`

4. (Optional) Seed sample data:
   - Visit `http://localhost:3000/api/seed-sample-data` after starting the server

## Step 3: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `Abubakarsidiq01/TrustNet`
4. Configure:
   - **Name**: `trustnet-web`
   - **Root Directory**: `web`
   - **Environment**: `Node`
   - **Node Version**: `20` (or latest LTS)
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Auto-Deploy**: `Yes` (deploys on push to main branch)

## Step 4: Set Environment Variables on Render

In your Web Service settings → Environment:

1. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the **Internal Database URL** from your PostgreSQL database
   - **Important**: Use the Internal URL, not External!

2. (Optional) Add:
   - **Key**: `NODE_ENV`
   - **Value**: `production`

## Step 5: Deploy

1. Render will automatically build and deploy when you push to main
2. Or manually trigger a deploy from the Render dashboard
3. Check the build logs to ensure:
   - Prisma Client generates successfully
   - Migrations run successfully
   - Next.js builds without errors

## Step 6: Verify Deployment

1. Visit your Render web service URL
2. Test key endpoints:
   - Landing page: `/`
   - Sign up: `/auth/sign-in?mode=signup`
   - Dashboard: `/dashboard/client` (after signing up)

## Troubleshooting

### Migration Errors
If migrations fail, you can reset and recreate:
```bash
# WARNING: This deletes all data!
npx prisma migrate reset
npm run prisma:migrate
```

### Database Connection Issues
- Verify `DATABASE_URL` uses the **Internal URL** for Render services
- Check that your PostgreSQL database is running on Render
- Ensure SSL mode is set: `?sslmode=require` in the connection string

### Build Failures
- Check that `prisma generate` runs successfully
- Verify all dependencies are in `package.json`
- Check build logs in Render dashboard

## Notes

- The codebase has been updated to use PostgreSQL instead of SQLite
- Old SQLite migrations are kept for reference but won't be used
- New PostgreSQL migrations will be created when you run `npm run prisma:migrate`
- The database schema is compatible with PostgreSQL

