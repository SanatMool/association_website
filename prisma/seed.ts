import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { members } from "../data/members";
import { events } from "../data/events";
import { news } from "../data/news";
import { committee } from "../data/committee";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.member.deleteMany();
  await prisma.event.deleteMany();
  await prisma.news.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.adminUser.deleteMany();

  // Seed members — deduplicate slugs by appending index if needed
  const slugCount = new Map<string, number>();
  const memberData = members.map((m) => {
    const count = (slugCount.get(m.slug) ?? 0) + 1;
    slugCount.set(m.slug, count);
    const slug = count > 1 ? `${m.slug}-${count}` : m.slug;
    return {
      name: m.name,
      slug,
      location: m.location,
      area: m.area,
      capacity: m.capacity,
      type: m.category,
      category: m.category,
      phone: m.phone,
      website: m.website,
      description: m.description,
      amenities: m.amenities,
      memberSince: m.memberSince,
      featured: m.featured ?? false,
    };
  });
  await prisma.member.createMany({ data: memberData });
  console.log(`✅ Seeded ${members.length} members`);

  // Seed events
  await prisma.event.createMany({
    data: events.map((e) => ({
      slug: e.slug,
      title: e.title,
      titleNe: e.titleNe,
      description: e.description,
      date: new Date(e.date),
      endDate: e.endDate ? new Date(e.endDate) : null,
      location: e.location,
      type: e.type,
      status: e.status,
      image: e.image,
    })),
  });
  console.log(`✅ Seeded ${events.length} events`);

  // Seed news
  await prisma.news.createMany({
    data: news.map((n) => ({
      slug: n.slug,
      title: n.title,
      titleNe: n.titleNe,
      excerpt: n.excerpt,
      content: n.content,
      author: n.author,
      category: n.category,
      image: n.image,
      publishedAt: new Date(n.date),
    })),
  });
  console.log(`✅ Seeded ${news.length} news items`);

  // Seed committee members
  const highlightedRoles = ["president", "vice_president"];
  await prisma.committeeMember.createMany({
    data: committee.map((c) => ({
      name: c.name,
      role: c.role,
      roleKey: c.roleKey,
      venue: c.venue,
      bio: c.bio,
      order: c.order,
      highlighted: highlightedRoles.includes(c.roleKey),
    })),
  });
  console.log(`✅ Seeded ${committee.length} committee members`);

  // Seed default admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.create({
    data: {
      name: "Admin",
      email: "admin@evanepal.org",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("✅ Created default admin user: admin@evanepal.org / admin123");

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
