import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const Asuslaptop = await prisma.product.create({
    data: {
      name: "Asus Laptop",
    },
  });

  const mymobile = await prisma.product.create({
    data: {
      name: "oneplus mobile",
    },
  });

  const watch = await prisma.product.create({
    data: {
      name: "boult wahtch",
    },
  });

  const punjab = await prisma.warehouse.create({
    data: {
      location: "phagwara punjab",
    },
  });

  const Ludiyana = await prisma.warehouse.create({
    data: {
      location: "Ludiyana",
    },
  });

  const watchlocation = await prisma.warehouse.create({
    data: {
      location: "madhubani",
    },
  });

  await prisma.inventory.createMany({
    data: [
      {
        productId: Asuslaptop.id,
        warehouseId: punjab.id,
        totalUnits: 10,
        reservedUnits: 0,
      },
      {
        productId: Asuslaptop.id,
        warehouseId: Ludiyana.id,
        totalUnits: 5,
        reservedUnits: 0,
      },
       
      {
        productId: mymobile.id,
        warehouseId: punjab.id,
        totalUnits: 8,
        reservedUnits: 0,
      },
      {
        productId: watch.id,
        warehouseId: watchlocation.id,
        totalUnits: 15,
        reservedUnits: 0,
      },
      

    ],
  });

  console.log("data inserted");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });