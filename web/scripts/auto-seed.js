/**
 * Auto-seed script for production
 * This script seeds sample data if the database is empty
 * Run this after migrations during deployment
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkIfSeeded() {
  const userCount = await prisma.user.count();
  return userCount > 0;
}

async function autoSeed() {
  try {
    console.log('Checking if database needs seeding...');
    
    const alreadySeeded = await checkIfSeeded();
    if (alreadySeeded) {
      console.log('Database already has data. Skipping seed.');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log('Database is empty. Starting seed...');

    // Create sample users
    const passwordHash = await bcrypt.hash('password123', 12);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'john.musa@example.com',
          name: 'John Musa',
          passwordHash,
          role: 'WORKER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'sade.okafor@example.com',
          name: 'Sade Okafor',
          passwordHash,
          role: 'WORKER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'client1@example.com',
          name: 'Aisha Bello',
          passwordHash,
          role: 'CLIENT',
        },
      }),
      prisma.user.create({
        data: {
          email: 'client2@example.com',
          name: 'Chidi Okoro',
          passwordHash,
          role: 'CLIENT',
        },
      }),
    ]);

    // Create worker profiles
    const workerProfiles = await Promise.all([
      prisma.workerProfile.create({
        data: {
          userId: users[0].id,
          name: 'John Musa',
          trade: 'Electrician',
          city: 'Lagos',
          area: 'Ikeja',
          state: 'Lagos State',
          country: 'Nigeria',
          skills: ['punctual', 'neat', 'fair pricing'],
        },
      }),
      prisma.workerProfile.create({
        data: {
          userId: users[1].id,
          name: 'Sade Okafor',
          trade: 'Electrician',
          city: 'Lagos',
          area: 'Yaba',
          state: 'Lagos State',
          country: 'Nigeria',
          skills: ['explains clearly', 'tidy install'],
        },
      }),
    ]);

    // Create client profiles
    const clientProfiles = await Promise.all([
      prisma.clientProfile.create({
        data: {
          userId: users[2].id,
          name: 'Aisha Bello',
          city: 'Lagos',
          area: 'Ikeja',
          state: 'Lagos State',
          country: 'Nigeria',
        },
      }),
      prisma.clientProfile.create({
        data: {
          userId: users[3].id,
          name: 'Chidi Okoro',
          city: 'Lagos',
          area: 'Yaba',
          state: 'Lagos State',
          country: 'Nigeria',
        },
      }),
    ]);

    // Create connections
    await prisma.connection.createMany({
      data: [
        { userAId: users[2].id, userBId: users[0].id }, // Aisha -> John
        { userAId: users[3].id, userBId: users[1].id }, // Chidi -> Sade
      ],
    });

    // Create jobs
    const jobs = await Promise.all([
      prisma.job.create({
        data: {
          workerId: workerProfiles[0].id,
          clientId: clientProfiles[0].id,
          title: 'Full flat rewiring',
          description: 'Complete rewiring of 3-bedroom apartment',
          city: 'Lagos',
          area: 'Ikeja',
          status: 'COMPLETED',
          verificationStatus: 'FULLY_VERIFIED',
        },
      }),
      prisma.job.create({
        data: {
          workerId: workerProfiles[1].id,
          clientId: clientProfiles[1].id,
          title: 'Office lighting install',
          description: 'Installation of LED lighting system',
          city: 'Lagos',
          area: 'Yaba',
          status: 'COMPLETED',
          verificationStatus: 'FULLY_VERIFIED',
        },
      }),
    ]);

    // Create trust scores
    await Promise.all([
      prisma.trustScoreSnapshot.create({
        data: {
          workerId: workerProfiles[0].id,
          total: 82,
          sentiment: 36,
          referrals: 44,
          verified: 20,
          freshness: 90,
        },
      }),
      prisma.trustScoreSnapshot.create({
        data: {
          workerId: workerProfiles[1].id,
          total: 75,
          sentiment: 38,
          referrals: 27,
          verified: 10,
          freshness: 90,
        },
      }),
    ]);

    // Create reviews
    await Promise.all([
      prisma.review.create({
        data: {
          jobId: jobs[0].id,
          reviewerId: clientProfiles[0].id,
          revieweeId: workerProfiles[0].id,
          authorId: users[2].id,
          text: 'Excellent work! Very punctual and professional. Fair pricing too.',
          punctuality: 5,
          communication: 5,
          pricingFairness: 4,
          skill: 5,
          sentimentScore: 0.85,
          isReferralBased: false,
          visibility: 'PUBLIC',
        },
      }),
      prisma.review.create({
        data: {
          jobId: jobs[1].id,
          reviewerId: clientProfiles[1].id,
          revieweeId: workerProfiles[1].id,
          authorId: users[3].id,
          text: 'Great service! Explained everything clearly and did a tidy installation.',
          punctuality: 4,
          communication: 5,
          pricingFairness: 4,
          skill: 4,
          sentimentScore: 0.80,
          isReferralBased: false,
          visibility: 'PUBLIC',
        },
      }),
    ]);

    console.log('✅ Sample data seeded successfully!');
    console.log(`   Created ${users.length} users, ${workerProfiles.length} workers, ${clientProfiles.length} clients`);
    console.log(`   Created ${jobs.length} jobs and reviews`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await prisma.$disconnect();
    // Don't fail the build if seeding fails
    process.exit(0);
  }
}

autoSeed();

