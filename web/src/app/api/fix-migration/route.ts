import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY ROUTE - DELETE AFTER USE
 * 
 * This route removes the failed migration record from the database.
 * Call this once via: GET /api/fix-migration
 * Then delete this file and redeploy.
 */
export async function GET() {
  try {
    // Execute raw SQL to delete the failed migration record
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20251202125815_fix_enum_types';`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Failed migration record deleted. You can now redeploy.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[fix-migration] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

