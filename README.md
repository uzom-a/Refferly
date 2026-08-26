# TrustNet

A network-backed reputation platform for finding trusted workers through verified referrals from your own connections. TrustNet helps you discover electricians, plumbers, cleaners, and handymen recommended by people you actually know—not random internet reviews.

![TrustNet](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)

## 🌟 Features

- **Network-Based Referrals**: See workers through your own network connections—neighbors, friends, colleagues
- **Trust Scoring**: Multi-dimensional trust scores based on referrals, sentiment analysis, and verified jobs
- **Verified Jobs**: Jobs confirmed by clients with optional photo proof and receipts
- **Interactive Network Graph**: Visualize your referral network and see how workers connect to you
- **Worker Profiles**: Detailed profiles with trust scores, reviews, and verified work history
- **Search & Discovery**: Find workers by trade, location, and trust score
- **Privacy-Focused**: Your network connections remain private while enabling trust verification

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Graph Visualization**: [vis-network](https://visjs.github.io/vis-network/)
- **Authentication**: bcryptjs for password hashing
- **Deployment**: [Render](https://render.com/)

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL database (local or hosted)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Abubakarsidiq01/TrustNet.git
cd TrustNet/web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `web` directory:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

For local development with Render's database, use the **External Database URL** from your Render dashboard.

### 4. Set Up the Database

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── graph/          # Network graph viewer
│   │   ├── onboarding/     # User onboarding flows
│   │   ├── profile/        # User profile pages
│   │   ├── search/         # Search and discovery
│   │   └── workers/        # Worker profile pages
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── ...            # Feature-specific components
│   ├── lib/               # Utility functions and helpers
│   └── store/             # Zustand state management
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── public/               # Static assets
```

## 🗄️ Database Schema

TrustNet uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Authentication and user accounts
- **WorkerProfile**: Worker profiles with skills, location, and bio
- **ClientProfile**: Client profiles
- **Job**: Job postings and work history
- **Review**: Reviews with sentiment analysis
- **TrustScoreSnapshot**: Computed trust scores over time
- **Connection**: User network connections
- **ConnectionRequest**: Connection requests between users

## 🚢 Deployment

### Deploying to Render

1. **Create PostgreSQL Database on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Create a new PostgreSQL database
   - Copy the Internal Database URL

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Root Directory**: `web`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
     - **Start Command**: `npm start`

3. **Set Environment Variables**
   - Add `DATABASE_URL` with your PostgreSQL Internal Database URL

4. **Deploy**
   - Render will automatically deploy on push to main branch
   - First deployment will run migrations automatically

For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations (development)
- `npm run prisma:migrate:deploy` - Apply migrations (production)
- `npm run prisma:push` - Push schema changes without migrations

## 🔐 Authentication

TrustNet uses email/password authentication with bcryptjs for password hashing. Users can sign up as either:
- **Workers**: Create profiles, receive job offers, build reputation
- **Clients**: Post jobs, hire workers, leave reviews

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Dark Theme**: Modern dark gradient backgrounds
- **Interactive Graphs**: Network visualization with vis-network
- **Smooth Animations**: Hover effects and transitions
- **Accessible**: Semantic HTML and ARIA labels

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Graph visualization powered by [vis-network](https://visjs.github.io/vis-network/)

---

**Note**: TrustNet is currently focused on Lagos, Nigeria, with plans to expand to other cities.
```

- Contributing guidelines

Customize as needed.
