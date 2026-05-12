import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    const body = await req.json();

    const { productId, warehouseId, quantity } = body;

    const lockKey = `lock:${productId}:${warehouseId}`;

    const lock = await redis.set(lockKey, "locked", {
        nx: true,
        ex: 5,
    });

    if (!lock) {
        return Response.json(
            { error: "Another reservation in progress" },
            { status: 409 }
        );
    }

    try {
        const inventory = await prisma.inventory.findFirst({
            where: { productId, warehouseId,},
        });

        if (!inventory) {
            return Response.json(
                { error: "Inventory not found" },
                { status: 404 }
            );
        }

        const available =
            inventory.totalStock - inventory.reservedStock;

        if (available < quantity) {
            return Response.json(
                { error: "Not enough stock" },
                { status: 409 }
            );
        }

        await prisma.inventory.update({
            where: {
                id: inventory.id,
            },
            data: {
                reservedStock: { increment: quantity,},
            },
        });

        const reservation = await prisma.reservation.create({
            data: {
                productId,
                warehouseId,
                quantity,
                status: "pending",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        return Response.json(reservation);

    } finally {
        await redis.del(lockKey);
    }
}