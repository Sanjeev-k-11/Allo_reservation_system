import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "products:all";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    const products = await prisma.product.findMany({
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      inventories: product.inventories.map((inv) => ({
        id: inv.id,
        warehouseId: inv.warehouseId,
        warehouse: inv.warehouse.location,
        totalUnits: inv.totalUnits,
        reservedUnits: inv.reservedUnits,
        availableStock: inv.totalUnits - inv.reservedUnits,
      })),
    }));

    await redis.set(cacheKey, formattedProducts, {
      ex: 60,
    });

    return NextResponse.json(formattedProducts);

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}