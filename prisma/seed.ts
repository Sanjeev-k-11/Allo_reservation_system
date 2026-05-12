import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const keyboard = await prisma.product.create({
    data: {
      name: "Allo Keyboard",
    },
  });

  const mouse = await prisma.product.create({
    data: {
      name: "Allo Mouse",
    },
  });

  const mumbai = await prisma.warehouse.create({
    data: {
      location: "Mumbai",
    },
  });

  const delhi = await prisma.warehouse.create({
    data: {
      location: "Delhi",
    },
  });

  await prisma.inventory.createMany({
    data: [
      {
        productId: keyboard.id,
        warehouseId: mumbai.id,
        totalUnits: 10,
        reservedUnits: 0,
      },
      {
        productId: keyboard.id,
        warehouseId: delhi.id,
        totalUnits: 5,
        reservedUnits: 0,
      },
      {
        productId: mouse.id,
        warehouseId: mumbai.id,
        totalUnits: 8,
        reservedUnits: 0,
      },
    ],
  });

  console.log("✅ data inserted");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });