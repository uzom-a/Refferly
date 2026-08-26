# TrustNet - Secure Digital Trust and Identity Reputation Network

This is a [Next.js](https://nextjs.org) project for TrustNet, a platform that verifies people, organizations, credentials, and claims through cryptographic verification, proof-of-identity, proof-of-action, and trust scoring.

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database (Render PostgreSQL recommended)
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `web` directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```
   For local development with Render's database, use the **External Database URL** from your Render dashboard.

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

This project uses **PostgreSQL** via Prisma ORM.

### Render PostgreSQL Database

The database is configured to use Render's PostgreSQL service:
- **Service ID**: `dpg-d4n2vdje5dus738pqf80-a`
- **Hostname**: `dpg-d4n2vdje5dus738pqf80-a`

### Database Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations (development)
- `npm run prisma:migrate:deploy` - Apply migrations (production)
- `npm run prisma:push` - Push schema changes without migrations

## Deployment on Render

### 1. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `trustnet-web` (or your choice)
   - **Root Directory**: `web`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`

### 2. Set Environment Variables

In your Render Web Service settings, add:

- **Key**: `DATABASE_URL`
- **Value**: Use the **Internal Database URL** from your Render PostgreSQL database dashboard

### 3. Deploy

Render will automatically deploy when you push to the main branch.

## Project Structure

- `/src/app` - Next.js App Router pages
- `/src/components` - React components
- `/src/lib` - Utility functions and Prisma client
- `/src/store` - Zustand state management
- `/prisma` - Prisma schema and migrations
- `/public` - Static assets

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Render Documentation](https://render.com/docs)
