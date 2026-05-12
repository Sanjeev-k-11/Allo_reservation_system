import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) {
        return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
      }
      if (reservation.status !== "pending") {
        return NextResponse.json({ error: "Reservation already processed" }, { status: 400 });
      }
      if (new Date() > reservation.expiresAt) {
        // Automatically release if expired during confirmation attempt
        await tx.reservation.update({ where: { id }, data: { status: "released" } });
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: { reservedUnits: { decrement: reservation.quantity } },
        });
        return NextResponse.json({ error: "Reservation has expired" }, { status: 410 });
      }

      // Confirm: update status, and permanently decrement total and reserved units
      await tx.reservation.update({ where: { id }, data: { status: "confirmed" } });
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      return NextResponse.json({ success: true, status: "confirmed" });
    });
  } catch (error) {
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}