import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return NextResponse.json(
          { error: "Reservation not found" },
          { status: 404 }
        );
      }

      if (reservation.status !== "pending") {
        return NextResponse.json(
          { error: "Reservation already processed" },
          { status: 400 }
        );
      }

      const redisKey = `lock:${reservation.inventoryId}`;

      if (new Date() > reservation.expiresAt) {
        await tx.reservation.update({
          where: { id },
          data: { status: "released" },
        });

        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: {
            reservedUnits: { decrement: reservation.quantity },
          },
        });

        await redis.del(redisKey);

        return NextResponse.json(
          { error: "Reservation has expired" },
          { status: 410 }
        );
      }

      await tx.reservation.update({
        where: { id },
        data: { status: "confirmed" },
      });

      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      await redis.del(redisKey);
      await redis.del("products:all");


      return NextResponse.json({
        success: true,
        status: "confirmed",
      });
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Confirmation failed" },
      { status: 500 }
    );
  }
}
