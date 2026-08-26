# Updated Build Command for Render

Due to a failed migration issue, the build command needs to include a cleanup script. Additionally, we now auto-seed sample data if the database is empty.

## Updated Build Command

Update your Render web service build command to:

```bash
npm install && npx prisma generate && node scripts/fix-failed-migration.js && npx prisma migrate deploy && node scripts/auto-seed.js && npm run build
```

## How to Update

1. Go to your Render Dashboard
2. Navigate to your web service
3. Go to "Settings"
4. Find "Build Command"
5. Replace it with the command above
6. Save and trigger a new deployment

## What This Does

1. Installs dependencies
2. Generates Prisma Client
3. **Cleans up any failed migration records** (prevents P3009 errors)
4. Runs database migrations
5. **Auto-seeds sample data** if database is empty (only runs if no users exist)
6. Builds the Next.js application

## Auto-Seeding

The `scripts/auto-seed.js` script will:
- Check if the database has any users
- If empty, create sample workers, clients, jobs, connections, and reviews
- If data exists, skip seeding (safe to run multiple times)

This ensures your production database has dummy data for testing and demonstration.

## After Migration Succeeds

Once the migration runs successfully and account creation works, you can:
1. Remove the `scripts/fix-failed-migration.js` file (if migrations are stable)
2. Update the build command to:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && node scripts/auto-seed.js && npm run build
   ```
