import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany();

    return NextResponse.json(warehouses);

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const warehouse = await prisma.warehouse.create({
      data: {
        location: body.location,
      },
    });

    return NextResponse.json(warehouse);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}