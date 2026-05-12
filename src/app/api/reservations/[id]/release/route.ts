import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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

      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          reservedUnits: {
            decrement: reservation.quantity,
          },
        },
      });

      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: {
          status: "released",
        },
      });

      await redis.del(`lock:${reservation.inventoryId}`);

      return NextResponse.json(updatedReservation);
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "failed to release reservation" },
      { status: 500 }
    );
  }
}