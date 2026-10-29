import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(){
    const defaultPassword = await bcrypt.hash("password123", 10);
    console.log("berhasil di hash");

    const admin = await prisma.user.upsert({
        where: {email: "admin@kopora.com"},
        update: {},
        create: {
            name: "Owner Kopora",
            email: "admin@kopora.com",
            password: defaultPassword,
            role: Role.ADMIN,
        },
    });

    const kasir = await prisma.user.upsert({
        where: {email: "kasir@kopora.com"},
        update: {},
        create: {
            name: "Kasir Kopora",
            email:"kasir@kopora.com",
            password: defaultPassword,
            role: Role.CASHIER,
        },
    });

    const barista = await prisma.user.upsert({
        where: {email: "barista@kopora.com"},
        update: {},
        create:{
            name: "Barista Kopora",
            email:"barista@kopora.com",
            password: defaultPassword,
            role: Role.BARISTA,
        },
    });

    const coffeeCategory = await prisma.category.upsert({
        where: {name: "Coffee"},
        update: {},
        create:{
            name: "Coffee",
        },
    });

    const kopiSusu = await prisma.menu.upsert({
        where: { id: "menu-kopi-susu-aren"},
        update: {},
        create: {
            id:"menu-kopi-susu-aren",
            name: "Kopi Susu Aren",
            description: "Kopi susu segar dari new zeeland",
            price: 20000,
            image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600",
            categoryId: coffeeCategory.id
        },
    });

}

main()
.catch((e) => {
    console.error("terjadi error pada seed:", e);
    process.exit(1);
})
.finally(async () =>{
    await prisma.$disconnect();
} )