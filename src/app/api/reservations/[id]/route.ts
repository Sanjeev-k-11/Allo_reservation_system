import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json(reservation);
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}