import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

// Charge .env.local (tsx n'a pas accès aux variables Next.js automatiquement)
try {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* ignore */ }

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SERVICE_CATEGORIES = [
  { id: "oil", name: "Vidange d'huile", icon: "🛢️", sortOrder: 1 },
  { id: "tires-winter", name: "Pneus d'hiver", icon: "❄️", sortOrder: 2 },
  { id: "tires-summer", name: "Pneus d'été / toutes saisons", icon: "☀️", sortOrder: 3 },
  { id: "brakes", name: "Freins", icon: "🔴", sortOrder: 4 },
  { id: "ac", name: "Climatisation", icon: "💨", sortOrder: 5 },
  { id: "engine", name: "Mécanique générale", icon: "🔧", sortOrder: 6 },
  { id: "inspection", name: "Inspection mécanique", icon: "🔍", sortOrder: 7 },
  { id: "battery", name: "Batterie", icon: "🔋", sortOrder: 8 },
  { id: "transmission", name: "Transmission", icon: "⚙️", sortOrder: 9 },
  { id: "bodywork", name: "Carrosserie", icon: "🚗", sortOrder: 10 },
  { id: "alignment", name: "Alignement", icon: "📐", sortOrder: 11 },
  { id: "suspension", name: "Suspension & direction", icon: "🌀", sortOrder: 12 },
  { id: "electrical", name: "Électrique / Électronique", icon: "⚡", sortOrder: 13 },
  { id: "exhaust", name: "Système d'échappement", icon: "💨", sortOrder: 14 },
  { id: "cooling", name: "Système de refroidissement", icon: "🌡️", sortOrder: 15 },
  { id: "detailing", name: "Détailing & lavage", icon: "✨", sortOrder: 16 },
  { id: "ev", name: "Véhicule électrique (VE)", icon: "🔌", sortOrder: 17 },
  { id: "glass", name: "Vitres & pare-brise", icon: "🪟", sortOrder: 18 },
];

async function main() {
  console.log("🌱 Démarrage du seed...");

  // Service categories
  for (const cat of SERVICE_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ ${SERVICE_CATEGORIES.length} catégories de services créées`);

  // Admin user
  const adminPwd = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@garago.ca" },
    update: {},
    create: { name: "Admin Garago", email: "admin@garago.ca", password: adminPwd, role: "ADMIN" },
  });
  console.log("✓ Admin créé:", admin.email);

  // Demo driver
  const driverPwd = await bcrypt.hash("driver1234", 12);
  const driver = await prisma.user.upsert({
    where: { email: "conducteur@exemple.com" },
    update: {},
    create: { name: "Jean Tremblay", email: "conducteur@exemple.com", password: driverPwd, role: "DRIVER", phone: "(514) 555-0001" },
  });
  console.log("✓ Conducteur de démo créé:", driver.email);

  // Demo garages
  const garagesData = [
    {
      email: "garage1@exemple.com",
      name: "Garage Tremblay & Fils",
      slug: "garage-tremblay-fils",
      address: "1234 Boulevard Saint-Laurent",
      city: "Montréal",
      postalCode: "H2X 2S6",
      phone: "(514) 555-1001",
      description: "Garage familial fondé en 1985, spécialisé en mécanique générale et entretien de véhicules japonais et coréens. Notre équipe de mécaniciens certifiés AIA offre un service personnalisé et honnête.",
      yearFounded: 1985,
      employeeCount: 8,
      languages: JSON.stringify(["fr", "en"]),
      acceptsWalkIn: true,
      services: ["oil", "tires-winter", "brakes", "engine", "inspection"],
      brands: ["Toyota", "Honda", "Hyundai", "Kia", "Nissan", "Mazda"],
      refusedBrands: [],
    },
    {
      email: "garage2@exemple.com",
      name: "Mécanique Laval Pro",
      slug: "mecanique-laval-pro",
      address: "567 Boulevard Curé-Labelle",
      city: "Laval",
      postalCode: "H7V 2L9",
      phone: "(450) 555-2002",
      description: "Centre de service complet pour tous types de véhicules. Spécialistes en systèmes électroniques et véhicules hybrides. Équipement de diagnostic dernier cri.",
      yearFounded: 2003,
      employeeCount: 12,
      languages: JSON.stringify(["fr"]),
      acceptsWalkIn: false,
      appointmentOnly: true,
      services: ["oil", "electrical", "ev", "engine", "alignment", "suspension"],
      brands: ["Toyota", "Honda", "Ford", "Chevrolet", "Hyundai", "Tesla"],
      refusedBrands: [],
    },
    {
      email: "garage3@exemple.com",
      name: "Pneus & Service Express MTL",
      slug: "pneus-service-express-mtl",
      address: "890 Rue Sherbrooke Est",
      city: "Montréal",
      postalCode: "H2L 1K4",
      phone: "(514) 555-3003",
      description: "Votre spécialiste pneus depuis 15 ans! Installation, balancement, entreposage et vente de pneus toutes marques. Également vidanges d'huile et entretien de base.",
      yearFounded: 2009,
      employeeCount: 6,
      languages: JSON.stringify(["fr", "en"]),
      acceptsWalkIn: true,
      services: ["tires-winter", "tires-summer", "oil", "alignment"],
      brands: ["Toyota", "Honda", "Ford", "Chevrolet", "Hyundai", "Kia", "Nissan", "Mazda", "Subaru", "Volkswagen"],
      refusedBrands: [],
    },
    {
      email: "garage4@exemple.com",
      name: "Centre Auto Québec",
      slug: "centre-auto-quebec",
      address: "456 Avenue Laurier",
      city: "Québec",
      postalCode: "G1R 2E5",
      phone: "(418) 555-4004",
      description: "Premier centre automobile de la région de Québec. Service complet pour tous vos besoins: mécanique, carrosserie, vitres et peinture.",
      yearFounded: 1998,
      employeeCount: 20,
      languages: JSON.stringify(["fr"]),
      acceptsWalkIn: true,
      services: ["oil", "tires-winter", "tires-summer", "brakes", "engine", "bodywork", "glass", "inspection"],
      brands: ["Toyota", "Honda", "Ford", "Chevrolet", "Dodge", "RAM", "Jeep", "Hyundai", "Kia", "Nissan"],
      refusedBrands: ["Ferrari", "Lamborghini"],
    },
  ];

  for (const gData of garagesData) {
    const pwd = await bcrypt.hash("garage1234", 12);
    const owner = await prisma.user.upsert({
      where: { email: gData.email },
      update: {},
      create: { name: `Propriétaire ${gData.name}`, email: gData.email, password: pwd, role: "GARAGE_OWNER" },
    });

    const garage = await prisma.garage.upsert({
      where: { slug: gData.slug },
      update: {},
      create: {
        ownerId: owner.id,
        name: gData.name,
        slug: gData.slug,
        address: gData.address,
        city: gData.city,
        postalCode: gData.postalCode,
        phone: gData.phone,
        email: gData.email,
        description: gData.description,
        yearFounded: gData.yearFounded,
        employeeCount: gData.employeeCount,
        languages: gData.languages,
        acceptsWalkIn: gData.acceptsWalkIn,
        appointmentOnly: (gData as any).appointmentOnly ?? false,
        subscriptionStatus: "ACTIVE",
        subscriptionEndAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Services
    await prisma.garageService.deleteMany({ where: { garageId: garage.id } });
    const serviceData: { [key: string]: { min: number; max: number; duration: number } } = {
      oil: { min: 59, max: 99, duration: 30 },
      "tires-winter": { min: 80, max: 120, duration: 60 },
      "tires-summer": { min: 80, max: 120, duration: 60 },
      brakes: { min: 200, max: 450, duration: 90 },
      engine: { min: 100, max: 500, duration: 120 },
      inspection: { min: 89, max: 149, duration: 60 },
      electrical: { min: 150, max: 400, duration: 90 },
      ev: { min: 200, max: 600, duration: 120 },
      alignment: { min: 89, max: 129, duration: 60 },
      suspension: { min: 200, max: 800, duration: 120 },
      bodywork: { min: 500, max: 3000, duration: 480 },
      glass: { min: 200, max: 600, duration: 60 },
    };

    for (const catId of gData.services) {
      const cat = await prisma.serviceCategory.findUnique({ where: { id: catId } });
      if (!cat) continue;
      const pricing = serviceData[catId] ?? { min: 50, max: 200, duration: 60 };
      await prisma.garageService.create({
        data: {
          garageId: garage.id,
          categoryId: catId,
          name: cat.name,
          priceMin: pricing.min,
          priceMax: pricing.max,
          durationMin: pricing.duration,
          active: true,
        },
      });
    }

    // Brands
    await prisma.garageBrand.deleteMany({ where: { garageId: garage.id } });
    for (const brand of gData.brands) {
      await prisma.garageBrand.create({ data: { garageId: garage.id, brand, accepts: true } });
    }
    for (const brand of gData.refusedBrands) {
      await prisma.garageBrand.create({ data: { garageId: garage.id, brand, accepts: false } });
    }

    // Availability (Mon-Fri 8-17, Sat 8-12, Sun closed)
    await prisma.garageAvailability.deleteMany({ where: { garageId: garage.id } });
    const schedule = [
      { day: 0, closed: true, open: "08:00", close: "17:00" },   // Sun
      { day: 1, closed: false, open: "08:00", close: "17:30" },  // Mon
      { day: 2, closed: false, open: "08:00", close: "17:30" },  // Tue
      { day: 3, closed: false, open: "08:00", close: "17:30" },  // Wed
      { day: 4, closed: false, open: "08:00", close: "17:30" },  // Thu
      { day: 5, closed: false, open: "08:00", close: "17:30" },  // Fri
      { day: 6, closed: false, open: "08:00", close: "12:00" },  // Sat
    ];
    for (const s of schedule) {
      await prisma.garageAvailability.create({
        data: { garageId: garage.id, dayOfWeek: s.day, openTime: s.open, closeTime: s.close, isClosed: s.closed },
      });
    }

    // Sample review
    const review = await prisma.review.findFirst({ where: { garageId: garage.id } });
    if (!review) {
      await prisma.review.create({
        data: {
          garageId: garage.id,
          userId: driver.id,
          rating: 5,
          title: "Excellent service!",
          comment: "Très professionnel et honnête. J'ai amené mon Toyota Camry pour une vidange d'huile et une inspection et tout s'est passé à merveille. Je recommande fortement!",
          service: "Vidange d'huile",
          vehicleMake: "Toyota",
          vehicleModel: "Camry",
          vehicleYear: 2019,
          isVerified: true,
        },
      });
    }

    console.log(`✓ Garage créé: ${gData.name} (${gData.city})`);
  }

  console.log("\n✅ Seed terminé avec succès!\n");
  console.log("Comptes de test:");
  console.log("  Admin:      admin@garago.ca / admin1234");
  console.log("  Conducteur: conducteur@exemple.com / driver1234");
  console.log("  Garage:     garage1@exemple.com / garage1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());
