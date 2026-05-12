import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { inventoryId, quantity = 1 } = await req.json();

  try {
    // 1. Atomic database update: Only increments if there is enough available stock.
    // This is 100% safe from race conditions under heavy concurrency.
    const result = await prisma.$executeRaw`
      UPDATE "Inventory"
      SET "reservedUnits" = "reservedUnits" + ${quantity}
      WHERE "id" = ${inventoryId}
        AND ("totalUnits" - "reservedUnits") >= ${quantity}
    `;

    // If result is 0, no rows were updated (meaning not enough stock)
    if (result === 0) {
      return NextResponse.json({ error: "Not enough stock available" }, { status: 409 });
    }

    // 2. Create the reservation record
    const reservation = await prisma.reservation.create({
      data: {
        inventoryId,
        quantity,
        status: "pending",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}