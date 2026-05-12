import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (reservation.status !== "pending") {
        return NextResponse.json({ error: "Already processed" }, { status: 400 });
      }

      // Release: update status and remove from reserved units pool
      await tx.reservation.update({ where: { id }, data: { status: "released" } });
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: { reservedUnits: { decrement: reservation.quantity } },
      });

      return NextResponse.json({ success: true, status: "released" });
    });
  } catch (error) {
    return NextResponse.json({ error: "Release failed" }, { status: 500 });
  }
}