import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventories: {
          include: { 
            warehouse: true 
          },
        },
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      inventories: product.inventories.map((inv) => ({
        id: inv.id,
        warehouse: inv.warehouse.location,
        totalUnits: inv.totalUnits,
        reservedUnits: inv.reservedUnits,
        availableStock: inv.totalUnits - inv.reservedUnits, 
      })),
    }));
    return NextResponse.json(formattedProducts);
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" }, 
      { status: 500 }
    );
  }
}