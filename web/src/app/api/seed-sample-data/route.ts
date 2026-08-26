import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const workerSeeds = [
  {
    name: "John Musa",
    email: "john.musa@example.com",
    trade: "Electrician",
    city: "Lagos",
    area: "Ikeja",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Ikeja, Lagos, Lagos State, Nigeria",
    latitude: 6.6018,
    longitude: 3.3515,
    skills: ["punctual", "neat", "fair pricing"],
    trust: { total: 82, sentiment: 36, referrals: 44, verified: 20 },
    pathToYou: "You → Aisha → John",
    networkSteps: 2,
  },
  {
    name: "Sade Okafor",
    email: "sade.okafor@example.com",
    trade: "Electrician",
    city: "Lagos",
    area: "Yaba",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Yaba, Lagos, Lagos State, Nigeria",
    latitude: 6.517,
    longitude: 3.3789,
    skills: ["explains clearly", "tidy install"],
    trust: { total: 75, sentiment: 38, referrals: 27, verified: 10 },
    pathToYou: "You → Chidi → Sade",
    networkSteps: 1,
  },
  {
    name: "Tunde Ademola",
    email: "tunde.ademola@example.com",
    trade: "Electrician",
    city: "Lagos",
    area: "Surulere",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Surulere, Lagos, Lagos State, Nigeria",
    latitude: 6.4926,
    longitude: 3.364,
    skills: ["fast response", "good follow-up"],
    trust: { total: 68, sentiment: 30, referrals: 25, verified: 13 },
    pathToYou: "You → Hassan → Tunde",
    networkSteps: 2,
  },
  {
    name: "Aisha Bello",
    email: "aisha.bello@example.com",
    trade: "Cleaner",
    city: "Lagos",
    area: "Yaba",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Yaba, Lagos, Lagos State, Nigeria",
    latitude: 6.517,
    longitude: 3.3789,
    skills: ["thorough", "reliable"],
    trust: { total: 76, sentiment: 40, referrals: 26, verified: 10 },
    pathToYou: "You → Farouk → Aisha",
    networkSteps: 2,
  },
  {
    name: "Michael Udo",
    email: "michael.udo@example.com",
    trade: "Plumber",
    city: "Lagos",
    area: "Lekki",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Lekki, Lagos, Lagos State, Nigeria",
    latitude: 6.452,
    longitude: 3.602,
    skills: ["honest", "no leaks after"],
    trust: { total: 79, sentiment: 35, referrals: 30, verified: 14 },
    pathToYou: "You → Amaka → Michael",
    networkSteps: 1,
  },
];

const clientSeeds = [
  {
    name: "Abubakar",
    email: "marvelloussanni2023@gmail.com",
    city: "Grambling",
    area: "Louisiana",
  },
  {
    name: "Demo Client",
    email: "demo.client@example.com",
    city: "Lagos",
    area: "Ikeja",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Ikeja, Lagos, Lagos State, Nigeria",
    latitude: 6.6018,
    longitude: 3.3515,
  },
  {
    name: "Aisha",
    email: "aisha.client@example.com",
    city: "Lagos",
    area: "Yaba",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Yaba, Lagos, Lagos State, Nigeria",
    latitude: 6.517,
    longitude: 3.3789,
  },
  {
    name: "Farouk",
    email: "farouk.client@example.com",
    city: "Lagos",
    area: "Magodo",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Magodo, Lagos, Lagos State, Nigeria",
    latitude: 6.635,
    longitude: 3.3743,
  },
  {
    name: "Chidi",
    email: "chidi.client@example.com",
    city: "Lagos",
    area: "Lekki",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Lekki, Lagos, Lagos State, Nigeria",
    latitude: 6.452,
    longitude: 3.602,
  },
  {
    name: "Hassan",
    email: "hassan.client@example.com",
    city: "Lagos",
    area: "Surulere",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Surulere, Lagos, Lagos State, Nigeria",
    latitude: 6.4926,
    longitude: 3.364,
  },
  {
    name: "Amaka",
    email: "amaka.client@example.com",
    city: "Lagos",
    area: "Victoria Island",
    state: "Lagos State",
    country: "Nigeria",
    fullAddress: "Victoria Island, Lagos, Lagos State, Nigeria",
    latitude: 6.4281,
    longitude: 3.4219,
  },
];

const connections: Array<{ a: string; b: string }> = [
  { a: "aisha.client@example.com", b: "marvelloussanni2023@gmail.com" },
  { a: "farouk.client@example.com", b: "marvelloussanni2023@gmail.com" },
  { a: "chidi.client@example.com", b: "marvelloussanni2023@gmail.com" },
  { a: "hassan.client@example.com", b: "marvelloussanni2023@gmail.com" },
  { a: "amaka.client@example.com", b: "marvelloussanni2023@gmail.com" },
  { a: "demo.client@example.com", b: "marvelloussanni2023@gmail.com" },
  { a: "marvelloussanni2023@gmail.com", b: "john.musa@example.com" },
  { a: "marvelloussanni2023@gmail.com", b: "sade.okafor@example.com" },
  { a: "marvelloussanni2023@gmail.com", b: "aisha.bello@example.com" },
  { a: "marvelloussanni2023@gmail.com", b: "michael.udo@example.com" },
  // Demo client to other clients
  { a: "demo.client@example.com", b: "aisha.client@example.com" },
  { a: "demo.client@example.com", b: "farouk.client@example.com" },
  { a: "demo.client@example.com", b: "chidi.client@example.com" },
  { a: "demo.client@example.com", b: "hassan.client@example.com" },
  { a: "demo.client@example.com", b: "amaka.client@example.com" },
  // Demo client to workers
  { a: "demo.client@example.com", b: "john.musa@example.com" },
  { a: "demo.client@example.com", b: "sade.okafor@example.com" },
  { a: "demo.client@example.com", b: "tunde.ademola@example.com" },
  { a: "demo.client@example.com", b: "aisha.bello@example.com" },
  { a: "demo.client@example.com", b: "michael.udo@example.com" },
  // Other clients to workers to mirror referral paths
  { a: "aisha.client@example.com", b: "john.musa@example.com" },
  { a: "chidi.client@example.com", b: "sade.okafor@example.com" },
  { a: "hassan.client@example.com", b: "tunde.ademola@example.com" },
  { a: "farouk.client@example.com", b: "aisha.bello@example.com" },
  { a: "amaka.client@example.com", b: "michael.udo@example.com" },
];

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

const jobSeeds = [
  {
    title: "Full flat rewiring",
    description: "Complete electrical rewiring after renovation.",
    city: "Lagos",
    area: "Ikeja",
    clientEmail: "marvelloussanni2023@gmail.com",
    workerEmail: "john.musa@example.com",
    review: {
      text: "John finished ahead of schedule and kept the site tidy.",
      punctuality: 5,
      communication: 4,
      pricingFairness: 4,
      skill: 5,
      sentimentScore: 0.82,
    },
  },
  {
    title: "Retail shop lighting upgrade",
    description: "Upgraded fittings and safety inspection for boutique.",
    city: "Lagos",
    area: "Yaba",
    clientEmail: "marvelloussanni2023@gmail.com",
    workerEmail: "sade.okafor@example.com",
    review: {
      text: "Sade explained every change clearly. Shop looks amazing.",
      punctuality: 4,
      communication: 5,
      pricingFairness: 4,
      skill: 5,
      sentimentScore: 0.9,
    },
  },
  {
    title: "Post-renovation deep cleaning",
    description: "Floor to ceiling clean for duplex in Magodo.",
    city: "Lagos",
    area: "Magodo",
    clientEmail: "marvelloussanni2023@gmail.com",
    workerEmail: "aisha.bello@example.com",
    review: {
      text: "Aisha’s team removed every speck of dust. Highly recommended.",
      punctuality: 5,
      communication: 4,
      pricingFairness: 5,
      skill: 5,
      sentimentScore: 0.95,
    },
  },
  {
    title: "Emergency pipe repair",
    description: "Fixed burst pipe and replaced faulty valves.",
    city: "Lagos",
    area: "Lekki",
    clientEmail: "marvelloussanni2023@gmail.com",
    workerEmail: "michael.udo@example.com",
    review: {
      text: "Michael arrived within the hour and stopped the leak permanently.",
      punctuality: 5,
      communication: 4,
      pricingFairness: 4,
      skill: 5,
      sentimentScore: 0.87,
    },
  },
  {
    title: "Generator rewiring",
    city: "Lagos",
    area: "Yaba",
    clientEmail: "aisha.client@example.com",
    workerEmail: "john.musa@example.com",
    review: {
      text: "Quick fix, generator now runs smoother.",
      punctuality: 4,
      communication: 4,
      pricingFairness: 4,
      skill: 4,
      sentimentScore: 0.75,
    },
  },
  {
    title: "Office clean-up sprint",
    city: "Lagos",
    area: "Victoria Island",
    clientEmail: "amaka.client@example.com",
    workerEmail: "aisha.bello@example.com",
    review: {
      text: "Sparkling office before investor visits.",
      punctuality: 5,
      communication: 4,
      pricingFairness: 5,
      skill: 5,
      sentimentScore: 0.91,
    },
  },
  {
    title: "Smart lighting install",
    city: "Lagos",
    area: "Lekki",
    clientEmail: "chidi.client@example.com",
    workerEmail: "sade.okafor@example.com",
    review: {
      text: "Neat wiring and patient walkthrough of the app.",
      punctuality: 4,
      communication: 5,
      pricingFairness: 4,
      skill: 5,
      sentimentScore: 0.93,
    },
  },
  {
    title: "Cold room cabling",
    city: "Lagos",
    area: "Surulere",
    clientEmail: "hassan.client@example.com",
    workerEmail: "tunde.ademola@example.com",
    review: {
      text: "Handled the industrial load without issues.",
      punctuality: 4,
      communication: 4,
      pricingFairness: 4,
      skill: 4,
      sentimentScore: 0.78,
    },
  },
  {
    title: "Kitchen pipe replacement",
    city: "Lagos",
    area: "Magodo",
    clientEmail: "farouk.client@example.com",
    workerEmail: "michael.udo@example.com",
    review: {
      text: "Solved recurring leak and left the place spotless.",
      punctuality: 5,
      communication: 4,
      pricingFairness: 4,
      skill: 5,
      sentimentScore: 0.88,
    },
  },
];

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not available in production." }, { status: 403 });
  }

  try {
    const passwordHash = await bcrypt.hash("password123", 12);
    const userMap = new Map<string, string>();
    const workerProfileMap = new Map<string, string>();
    const clientProfileMap = new Map<string, string>();

    // Upsert clients
    for (const client of clientSeeds) {
      const user = await prisma.user.upsert({
        where: { email: client.email },
        update: { name: client.name },
        create: {
          email: client.email,
          name: client.name,
          role: "CLIENT",
          passwordHash,
        },
      });

      userMap.set(client.email, user.id);

      const locationFields: Record<string, unknown> = {};
      if (client.state) locationFields.state = client.state;
      if (client.country) locationFields.country = client.country;
      if (client.fullAddress) locationFields.fullAddress = client.fullAddress;
      if (typeof client.latitude === "number") locationFields.latitude = client.latitude;
      if (typeof client.longitude === "number") locationFields.longitude = client.longitude;

      const profile = await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {
          name: client.name,
          city: client.city,
          area: client.area,
          ...locationFields,
        },
        create: {
          userId: user.id,
          name: client.name,
          city: client.city,
          area: client.area,
          ...locationFields,
        },
      });

      clientProfileMap.set(client.email, profile.id);
    }

    // Upsert workers
    for (const worker of workerSeeds) {
      const user = await prisma.user.upsert({
        where: { email: worker.email },
        update: { name: worker.name },
        create: {
          email: worker.email,
          name: worker.name,
          role: "WORKER",
          passwordHash,
        },
      });

      userMap.set(worker.email, user.id);

      const workerLocationFields: Record<string, unknown> = {};
      if (worker.state) workerLocationFields.state = worker.state;
      if (worker.country) workerLocationFields.country = worker.country;
      if (worker.fullAddress) workerLocationFields.fullAddress = worker.fullAddress;
      if (typeof worker.latitude === "number") workerLocationFields.latitude = worker.latitude;
      if (typeof worker.longitude === "number") workerLocationFields.longitude = worker.longitude;

      const profile = await prisma.workerProfile.upsert({
        where: { userId: user.id },
        update: {
          name: worker.name,
          trade: worker.trade,
          city: worker.city,
          area: worker.area,
          skills: worker.skills as Prisma.InputJsonValue,
          pathToYou: worker.pathToYou,
          networkSteps: worker.networkSteps,
          ...workerLocationFields,
        },
        create: {
          userId: user.id,
          name: worker.name,
          trade: worker.trade,
          city: worker.city,
          area: worker.area,
          skills: worker.skills as Prisma.InputJsonValue,
          pathToYou: worker.pathToYou,
          networkSteps: worker.networkSteps,
          ...workerLocationFields,
        },
      });

      workerProfileMap.set(worker.email, profile.id);

      await prisma.trustScoreSnapshot.deleteMany({ where: { workerId: profile.id } });
      await prisma.trustScoreSnapshot.create({
        data: {
          workerId: profile.id,
          total: worker.trust.total,
          sentiment: worker.trust.sentiment,
          referrals: worker.trust.referrals,
          verified: worker.trust.verified,
          freshness: 85,
        },
      });
    }

    // Upsert connections
    for (const connection of connections) {
      const userAId = userMap.get(connection.a);
      const userBId = userMap.get(connection.b);
      if (!userAId || !userBId) continue;

      const [normalizedA, normalizedB] = normalizePair(userAId, userBId);

      await prisma.connection.upsert({
        where: {
          userAId_userBId: {
            userAId: normalizedA,
            userBId: normalizedB,
          },
        },
        update: {},
        create: {
          userAId: normalizedA,
          userBId: normalizedB,
        },
      });

      await prisma.connectionRequest.upsert({
        where: {
          senderId_receiverId: {
            senderId: userAId,
            receiverId: userBId,
          },
        },
        update: {
          status: "ACCEPTED",
        },
        create: {
          senderId: userAId,
          receiverId: userBId,
          status: "ACCEPTED",
        },
      });
    }

    for (const job of jobSeeds) {
      const clientProfileId = clientProfileMap.get(job.clientEmail);
      const workerProfileId = workerProfileMap.get(job.workerEmail);
      const clientUserId = userMap.get(job.clientEmail);
      if (!clientProfileId || !workerProfileId || !clientUserId) continue;

      const existingJob = await prisma.job.findFirst({
        where: {
          title: job.title,
          clientId: clientProfileId,
          workerId: workerProfileId,
        },
      });

      const jobRecord =
        existingJob ??
        (await prisma.job.create({
          data: {
            workerId: workerProfileId,
            clientId: clientProfileId,
            title: job.title,
            description: job.description ?? null,
            city: job.city,
            area: job.area,
            status: "COMPLETED",
            verificationStatus: "FULLY_VERIFIED",
          },
        }));

      if (job.review) {
        const existingReview = await prisma.review.findFirst({
          where: { jobId: jobRecord.id },
        });
        if (!existingReview) {
          await prisma.review.create({
            data: {
              jobId: jobRecord.id,
              reviewerId: clientProfileId,
              revieweeId: workerProfileId,
              text: job.review.text,
              punctuality: job.review.punctuality,
              communication: job.review.communication,
              pricingFairness: job.review.pricingFairness,
              skill: job.review.skill,
              sentimentScore: job.review.sentimentScore,
              isReferralBased: true,
              visibility: "PUBLIC",
              authorId: clientUserId,
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        message: "Sample data seeded successfully.",
        workers: workerSeeds.length,
        clients: clientSeeds.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[seed-sample-data]", error);
    return NextResponse.json(
      { message: "Unable to seed sample data." },
      { status: 500 },
    );
  }
}


