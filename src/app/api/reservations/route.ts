import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { redis } from "@/lib/redis";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inventoryId, quantity = 1 } = body;

    if (!inventoryId) {
      return NextResponse.json(
        { error: "Missing required: inventoryId" },
        { status: 400 }
      );
    }

    const redisKey = `lock:${inventoryId}`;
    const isLocked = await redis.get(redisKey);

    if (isLocked) {
      return NextResponse.json(
        { error: "Item temporarily reserved by someone else" },
        { status: 409 }
      );
    } 
    await redis.set(redisKey, "locked", {
      ex: 600, 
    });
 
    const result = await prisma.$executeRaw`
      UPDATE "Inventory"
      SET "reservedUnits" = "reservedUnits" + ${quantity}
      WHERE "id" = ${inventoryId}
        AND ("totalUnits" - "reservedUnits") >= ${quantity}
    `;

    if (result === 0) { 
      await redis.del(redisKey);

      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }
    const reservation = await prisma.reservation.create({
      data: {
        inventoryId,
        quantity,
        status: "pending",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await redis.del("products:all");
    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Reservation Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
