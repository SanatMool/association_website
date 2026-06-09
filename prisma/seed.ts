import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { members as evaMembers } from "../data/members";
import { events } from "../data/events";
import { news } from "../data/news";
import { committee } from "../data/committee";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Simple slug generator (no external deps)
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// BHAKTAPUR ASSOCIATION — 41 members
// ─────────────────────────────────────────────────────────────────────────────

const bhaktapurMembers = [
  { name_en: "Star Banquet", name_np: "स्टार बैंक्वेट", address_en: "Kamalbinayak, Bhaktapur", address_np: "कमलविनायक, भक्तपुर", owner_en: "Sanaram Sangachhe", owner_np: "सानाराम साँगाछे", phone: "9851003173" },
  { name_en: "Yachu Party Venue", name_np: "यचु पार्टी भेन्यु", address_en: "Naya Thimi, Madhyapur Thimi", address_np: "नयाँ थिमि, मध्यपुर थिमि न.पा.", owner_en: "Prabin Shrestha", owner_np: "प्रविन श्रेष्ठ", phone: "9848943025" },
  { name_en: "Thimi Banquet", name_np: "थिमी बैंक्वेट", address_en: "Sundar Nagar, Thimi", address_np: "सुन्दर नगर, थिमि", owner_en: "Indrastha Shrestha", owner_np: "इन्द्रस्त श्रेष्ठ", phone: "9848948791" },
  { name_en: "New Everest Party Palace", name_np: "न्यू एभरेष्ट पार्टी प्यालेस", address_en: "Purano Thimi", address_np: "पुरानो थिमि", owner_en: "Bhakta Lal Shrestha", owner_np: "भक्त लाल श्रेष्ठ", phone: "9851075403" },
  { name_en: "Shree Anima Party Mahal", name_np: "श्री अनिमा पार्टी महल", address_en: "Barahi Pith, Bhaktapur", address_np: "बाराही पिठ, भक्तपुर", owner_en: "Krishna Sharan Changu", owner_np: "कृष्ण शरण चांगु", phone: "9841845531" },
  { name_en: "Bhaktapur Banquet", name_np: "भक्तपुर बैंक्वेट", address_en: "Kalo Party, Bhaktapur", address_np: "कालो पार्टी, भक्तपुर", owner_en: "Bishnu Dhapa", owner_np: "विष्णु धापा", phone: "9841527570" },
  { name_en: "Siddhapokhari Party Palace", name_np: "सिद्धपोखरी पार्टी प्यालेस", address_en: "Siddha Pokhari, Bhaktapur", address_np: "सिद्ध पोखरी, भक्तपुर", owner_en: "Shiva Prasad Hyaju", owner_np: "शिव प्रसाद ह्योजु", phone: "9851052336" },
  { name_en: "Yuwan Rental Service", name_np: "एवान रेन्टल सर्भिस", address_en: "Kaushaltar", address_np: "कोशलटार", owner_en: "Ishwor Shrestha", owner_np: "ईश्वर श्रेष्ठ", phone: "9841960390" },
  { name_en: "Mahakali Catering", name_np: "महाकाली क्याटरिङ", address_en: "Mahakali Sthan, Bhaktapur", address_np: "महाकाली स्थान, भक्तपुर", owner_en: "Purnaottam Deyapaye", owner_np: "पूर्णोत्तम देयपये", phone: "9851060542" },
  { name_en: "Bhaktapur Party Venue", name_np: "भक्तपुर पार्टी भेन्यु", address_en: "Suryabinayak", address_np: "गःपलि, सूर्यविनायक", owner_en: "Prithvi Bhakta Prajapati", owner_np: "पृथ्वी भक्त प्रजापति", phone: "9851196822" },
  { name_en: "Dhapa Party Palace", name_np: "धापा पार्टी प्यालेस", address_en: "Suryabinayak, Bhaktapur", address_np: "सूर्यविनायक, भक्तपुर", owner_en: "Nani Babu Dhapa", owner_np: "नानी बाबु धापा", phone: "9851131688" },
  { name_en: "Shubhakamana Party Palace", name_np: "शुभकामना पार्टी प्यालेस", address_en: "Suryabinayak, Bhaktapur", address_np: "सूर्यविनायक, भक्तपुर", owner_en: "Shiva Prasad Lage", owner_np: "शिव प्रसाद लागे", phone: "9762349106" },
  { name_en: "Shankhadhar Party Palace", name_np: "शंखधर पार्टी प्यालेस", address_en: "Shankhadhar Chowk", address_np: "शंखधर चोक", owner_en: "Shyam Sundar Shrestha", owner_np: "श्याम सुन्दर श्रेष्ठ", phone: "9841816591" },
  { name_en: "Mizan Banquet", name_np: "मिजन बैंक्वेट", address_en: "Balakot", address_np: "बालकोट", owner_en: "Chhabi Lal Guragai", owner_np: "छवि लाल गुरगाँई", phone: "9841555594" },
  { name_en: "Dibyashwori Party Palace", name_np: "दिव्यश्वरी पार्टी प्यालेस", address_en: "Lokanthali, Madhyapur Thimi", address_np: "लोकन्थली, मध्यपुर थिमि", owner_en: "Nawaraj Chaulagai", owner_np: "नवराज चौलागाई", phone: "9841257488" },
  { name_en: "Everest Rental Service", name_np: "एभरेष्ट रेन्टल सर्भिस", address_en: "Milroad, Madhyapur Thimi", address_np: "मिलरोड, मध्यपुर थिमि", owner_en: "Chandra Krishna Shrestha", owner_np: "चन्द्र कृष्ण श्रेष्ठ", phone: "9851027544" },
  { name_en: "Maheshwori Banquet", name_np: "महेश्वरी बैंक्वेट", address_en: "Liwali, Bhaktapur", address_np: "लिवाली, भक्तपुर", owner_en: "Shiva Sitikhu", owner_np: "शिव सितिखु", phone: "9851010502" },
  { name_en: "Nirmal Banquet", name_np: "निर्मल बैंक्वेट", address_en: "Lokanthali", address_np: "लोकन्थली", owner_en: "Nirmal Basnet", owner_np: "निर्मल बस्नेत", phone: "9861936578" },
  { name_en: "Na Pukhu Banquet", name_np: "नःपुखु बैंक्वेट", address_en: "Minbhawan, Bhaktapur", address_np: "मिनभवनपार्क, नःपुखु, भक्तपुर", owner_en: "Sunita Bajracharya", owner_np: "सुनिता बज्राचार्य", phone: "9851124808" },
  { name_en: "Bhaktapur Tent House", name_np: "भक्तपुर टेन्ट हाउस", address_en: "Suryabinayak, Bhaktapur", address_np: "गःपलि, भक्तपुर", owner_en: "Rajan Chitrakar", owner_np: "राजन चित्रकार", phone: "9851195291" },
  { name_en: "Nyatapola Food Banquet", name_np: "न्यातापोल फुड बैंक्वेट", address_en: "Chundevi Height, Bhaktapur", address_np: "चुन्डेवी हाइट, भक्तपुर", owner_en: "Krishna Sharan Changu", owner_np: "कृष्ण शरण चांगु", phone: "9851050765" },
  { name_en: "Shubha Shree Banquet", name_np: "शुभ श्री बैंक्वेट", address_en: "Siddikali", address_np: "सिद्धिकाली", owner_en: "Jagat Krishna Hyaju", owner_np: "जगत कृष्ण ह्याजु", phone: "9848408755" },
  { name_en: "Indra Shanti Banquet", name_np: "इन्द्र शान्ति बैंक्वेट", address_en: "Lokanthali", address_np: "लोकन्थली", owner_en: "Tej Bahadur Kunwar", owner_np: "तेज बहादुर कुँवर", phone: "9851051955" },
  { name_en: "Imperial Banquet", name_np: "इम्पेरियल बैंक्वेट", address_en: "Chundevi, Bhaktapur", address_np: "चुन्डेवी, भक्तपुर", owner_en: "Ashish Shrestha", owner_np: "आशिष श्रेष्ठ", phone: "9841337603" },
  { name_en: "White Palace Banquet", name_np: "ह्वाइट प्यालेस बैंक्वेट", address_en: "Kaushaltar, Bhaktapur", address_np: "कोशलटार, भक्तपुर", owner_en: "Manoj Dhapa", owner_np: "मनोज धापा", phone: "9851032505" },
  { name_en: "Global Tent House", name_np: "ग्लोबल टेन्ट हाउस", address_en: "Duwakot-2, Bhaktapur", address_np: "दुवाकोट-२, भक्तपुर", owner_en: "Ganesh Shrestha", owner_np: "गणेश श्रेष्ठ", phone: "9841368938" },
  { name_en: "Nil Barahi Catering Service", name_np: "निल बाराही क्याटरिङ सर्भिस", address_en: "Tikathali, Bode", address_np: "टिकठली, बोडे", owner_en: "Prem Bhakta Rajbahak", owner_np: "प्रेम भक्त राजबहाक", phone: "9841082557" },
  { name_en: "Heritage Palace Banquet", name_np: "हेरिटेज प्यालेस बैंक्वेट", address_en: "Radheradhe, Bhaktapur", address_np: "राधेराधे, भक्तपुर", owner_en: "Surendra Tamrakar", owner_np: "सुरेन्द्र ताम्रकार", phone: "9851225619" },
  { name_en: "Bard Darbar Party Palace", name_np: "बर्ड दरबार पार्टी प्यालेस", address_en: "Liwali, Bhaktapur", address_np: "लिवाली, भक्तपुर", owner_en: "Jitendra Khaymali", owner_np: "जितेन्द्र खायमली", phone: "9851102800" },
  { name_en: "Budhathoki Party Palace", name_np: "बुढाथोकी पार्टी प्यालेस", address_en: "Sirstar, Bhaktapur", address_np: "सिरुटार, भक्तपुर", owner_en: "Umesh Budhathoki", owner_np: "उमेश बुढाथोकी", phone: "9841968667" },
  { name_en: "Kaustar Palace", name_np: "कोस्टार प्यालेस", address_en: "Kaustar", address_np: "कोस्टार", owner_en: "Rajesh Shrestha", owner_np: "राजेश श्रेष्ठ", phone: "9851058282" },
  { name_en: "Bas Event Management and Rental Service", name_np: "बास इभेन्ट म्यानेजमेन्ट एण्ड रेन्टल सर्भिस", address_en: "Kamalbinayak", address_np: "कमलविनायक", owner_en: "Hari Narayan Basi", owner_np: "हरी नारायण बासी", phone: "9851108800" },
  { name_en: "Ghar Aagan Catering", name_np: "घर आंगन क्याटरिङ", address_en: "Fohokhel, Bhaktapur", address_np: "फोहोखेल, भक्तपुर", owner_en: "Basudev Dhapa", owner_np: "वासुदेव धापा", phone: "9840002593" },
  { name_en: "Duwakot City Banquet", name_np: "दुवाकोट सिटी बैंक्वेट", address_en: "Duwakot-2, Bhaktapur", address_np: "दुवाकोट-२, भक्तपुर", owner_en: "Kalikaran Karki", owner_np: "कालिकरण कार्की", phone: "9851072871" },
  { name_en: "Namaste Banquet", name_np: "नमस्ते बैंक्वेट", address_en: "Sallaghari, Bhaktapur", address_np: "सल्लाघारी, भक्तपुर", owner_en: "Rakesh Khatri", owner_np: "राकेश खत्री", phone: "9851109633" },
  { name_en: "Yo Yo Banquet", name_np: "यो यो बैंक्वेट", address_en: "Chyamasingh, Bhaktapur", address_np: "च्याम्हासिंह, भक्तपुर", owner_en: "Roshan Gwacha", owner_np: "रोशन ग्वाछा", phone: "9851066633" },
  { name_en: "Talju Darbar", name_np: "तलेजु दरबार", address_en: "Ram Mandir", address_np: "राम मन्दिर", owner_en: "Biju Byanjankar", owner_np: "बिजु व्यन्जनकार", phone: "9851052196" },
  { name_en: "Sheraton Banquet", name_np: "शेराटन बैंक्वेट", address_en: "Jagati-5, Suryabinayak", address_np: "जगाती-५, सूर्यविनायक", owner_en: "Nitesh Shah", owner_np: "नितेश शाह", phone: "9851195007" },
  { name_en: "Annapurna Catering", name_np: "अन्नपूर्ण क्याटरिङ", address_en: "Brahmayani Mandir", address_np: "ब्रह्मायणी मन्दिर", owner_en: "Hari Shiju", owner_np: "हरी शिजु", phone: "9851087660" },
  { name_en: "Bala Events and Lawn Services", name_np: "बाला इभेन्ट्स एण्ड लन सर्भिसेज", address_en: "Kamalbinayak, Bhaktapur", address_np: "कमलविनायक, भक्तपुर", owner_en: "Dil Kumar Bala", owner_np: "दिल कुमार बाला", phone: "9843619034" },
  { name_en: "New Public Rental Service", name_np: "न्यू पब्लिक रेन्टल सर्भिस", address_en: "Suryabinayak-2, Balakot", address_np: "सूर्यविनायक न.पा.-२, बालकोट", owner_en: "Nawaraj Shrestha", owner_np: "नवराज श्रेष्ठ", phone: "9851055588" },
];

// ─────────────────────────────────────────────────────────────────────────────
// EVA NEPAL — Timeline milestones (extracted from hardcoded Timeline.tsx)
// ─────────────────────────────────────────────────────────────────────────────

const evaTimeline = [
  { year: 2011, title: "EVA Nepal Founded", description: "Event and Venue Association Nepal was formally established in Maitidevi, Kathmandu, uniting the valley's banquet hall and event venue owners under one voice.", stat: "Founding Year", highlighted: true, order: 1 },
  { year: 2012, title: "First Annual General Meeting", description: "EVA Nepal held its inaugural Annual General Meeting, establishing the executive committee structure and drafting the association's foundational bylaws.", stat: "20+ Founding Members", highlighted: false, order: 2 },
  { year: 2014, title: "Quality Standards Initiative", description: "The association launched its first Quality Standards Framework, setting benchmarks for service quality, hygiene, and safety across member venues.", stat: "First Quality Framework", highlighted: false, order: 3 },
  { year: 2016, title: "Training Programs Launched", description: "EVA Nepal introduced structured training and workshop programs for venue owners and staff, covering event management, catering standards, and customer service.", stat: "500+ Trained", highlighted: false, order: 4 },
  { year: 2018, title: "Member Directory Goes Digital", description: "The association launched a comprehensive digital member directory, helping event planners and couples find and connect with certified EVA Nepal member venues.", stat: "80+ Listed Venues", highlighted: false, order: 5 },
  { year: 2020, title: "Resilience Through Challenge", description: "EVA Nepal supported its members through industry disruptions, organizing relief coordination, guidance on health protocols, and advocating for the event industry.", stat: "Industry Solidarity", highlighted: false, order: 6 },
  { year: 2022, title: "Kathmandu Venue Expo Launched", description: "The first Kathmandu Venue Expo brought together 40+ member venues at BhrikutiMandap, creating Nepal's largest gathering of event venues in one place.", stat: "40+ Venues Exhibited", highlighted: false, order: 7 },
  { year: 2024, title: "Nepal Venue Industry Conference", description: "EVA Nepal hosted the Nepal Venue Industry Conference, bringing together government officials, industry leaders, and 100+ venue owners for a two-day policy summit.", stat: "100+ Attendees", highlighted: false, order: 8 },
  { year: 2025, title: "150+ Member Milestone", description: "EVA Nepal reached a landmark milestone of 150+ registered member venues across the Kathmandu Valley, cementing its position as the definitive industry body.", stat: "150+ Members", highlighted: true, order: 9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding multi-tenant database...\n");

  // ── Clear all data (FK-safe order) ─────────────────────────────────────────
  console.log("🗑  Clearing existing data...");
  await prisma.apiLog.deleteMany();
  await prisma.timelineEntry.deleteMany();
  await prisma.memberAssociation.deleteMany();
  await prisma.adminTask.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.news.deleteMany();
  await prisma.event.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.platformUser.deleteMany();
  await prisma.association.deleteMany();
  await prisma.member.deleteMany();
  console.log("   ✓ Cleared\n");

  // ── Create Associations ────────────────────────────────────────────────────
  console.log("🏛  Creating associations...");

  const evaAssociation = await prisma.association.create({
    data: {
      name: "Event and Venue Association Nepal",
      nameNe: "इभेन्ट एण्ड भेन्यु एसोसिएशन नेपाल",
      slug: "eva-nepal",
      domain: "eva.nibjar.com",
      logo: "/evanepal.png",
      themeColor: "#0a1040",
      accentColor: "#f59e0b",
      foundedYear: 2011,
      description: "Official industry body for event venues in Kathmandu since 2011. Representing 150+ member venues across Kathmandu Valley.",
      active: true,
      plan: "standard",
    },
  });

  const bhaktapurAssociation = await prisma.association.create({
    data: {
      name: "Bhaktapur Party Palace & Catering Association",
      nameNe: "भक्तपुर पार्टी प्यालेस तथा क्याटरिङ संघ",
      slug: "bhaktapur",
      domain: "bhaktapur.nibjar.com",
      logo: "/bhaktapur.png",
      themeColor: "#1e3a5f",
      accentColor: "#c0392b",
      foundedYear: 2069, // BS year shown in logo (स्था. २०६९)
      description: "Association of party palaces and catering services in Bhaktapur district.",
      active: true,
      plan: "basic",
    },
  });

  console.log(`   ✓ ${evaAssociation.name}`);
  console.log(`   ✓ ${bhaktapurAssociation.name}\n`);

  // ── Seed EVA Nepal Members (155) ───────────────────────────────────────────
  console.log("👥 Seeding EVA Nepal members...");

  const slugCount = new Map<string, number>();
  const evaMemberData = evaMembers.map((m) => {
    const base = m.slug;
    const count = (slugCount.get(base) ?? 0) + 1;
    slugCount.set(base, count);
    const slug = count > 1 ? `${base}-${count}` : base;
    return {
      name: m.name,
      slug,
      location: m.location,
      area: m.area,
      capacity: m.capacity ?? null,
      type: m.category ?? null,
      category: m.category ?? null,
      phone: m.phone ?? null,
      website: m.website ?? null,
      description: m.description ?? null,
      amenities: m.amenities ?? [],
      memberSince: m.memberSince ?? null,
      featured: m.featured ?? false,
      active: true,
    };
  });

  const createdEvaMembers = await Promise.all(
    evaMemberData.map((data) => prisma.member.create({ data }))
  );

  // Link all EVA Nepal members to EVA Nepal association
  await prisma.memberAssociation.createMany({
    data: createdEvaMembers.map((m) => ({
      memberId: m.id,
      associationId: evaAssociation.id,
      visible: true,
      primary: true,
    })),
  });

  console.log(`   ✓ ${createdEvaMembers.length} members seeded and linked\n`);

  // ── Seed Bhaktapur Members (41) ────────────────────────────────────────────
  console.log("👥 Seeding Bhaktapur members...");

  const bhaktapurSlugCount = new Map<string, number>();
  const bhaktapurMemberData = bhaktapurMembers.map((m) => {
    const base = slugify(m.name_en);
    const count = (bhaktapurSlugCount.get(base) ?? 0) + 1;
    bhaktapurSlugCount.set(base, count);
    const slug = count > 1 ? `${base}-${count}` : base;
    return {
      name: m.name_en,
      nameNe: m.name_np,
      slug,
      area: "Bhaktapur",
      location: m.address_en,
      addressNe: m.address_np,
      phone: m.phone,
      ownerName: m.owner_en,
      ownerNameNe: m.owner_np,
      amenities: [] as string[],
      active: true,
      featured: false,
      // capacity, type not available for Bhaktapur — remain null
    };
  });

  const createdBhaktapurMembers = await Promise.all(
    bhaktapurMemberData.map((data) => prisma.member.create({ data }))
  );

  // Link all Bhaktapur members to Bhaktapur association
  await prisma.memberAssociation.createMany({
    data: createdBhaktapurMembers.map((m) => ({
      memberId: m.id,
      associationId: bhaktapurAssociation.id,
      visible: true,
      primary: true,
    })),
  });

  console.log(`   ✓ ${createdBhaktapurMembers.length} members seeded and linked\n`);

  // ── Seed Events → EVA Nepal ────────────────────────────────────────────────
  console.log("📅 Seeding events...");
  await prisma.event.createMany({
    data: events.map((e) => ({
      slug: e.slug,
      title: e.title,
      titleNe: e.titleNe ?? null,
      description: e.description,
      date: new Date(e.date),
      endDate: e.endDate ? new Date(e.endDate) : null,
      location: e.location,
      type: e.type,
      status: e.status,
      image: e.image ?? null,
      associationId: evaAssociation.id,
    })),
  });
  console.log(`   ✓ ${events.length} events seeded\n`);

  // ── Seed News → EVA Nepal ──────────────────────────────────────────────────
  console.log("📰 Seeding news...");
  await prisma.news.createMany({
    data: news.map((n) => ({
      slug: n.slug,
      title: n.title,
      titleNe: n.titleNe ?? null,
      excerpt: n.excerpt,
      content: n.content,
      author: n.author,
      category: n.category,
      image: n.image ?? null,
      publishedAt: new Date(n.date),
      associationId: evaAssociation.id,
    })),
  });
  console.log(`   ✓ ${news.length} news articles seeded\n`);

  // ── Seed Committee → EVA Nepal ─────────────────────────────────────────────
  console.log("👔 Seeding committee members...");
  const highlightedRoles = ["president", "immediate_past_president"];
  await prisma.committeeMember.createMany({
    data: committee.map((c) => ({
      name: c.name,
      nameNe: c.nameNe ?? null,
      role: c.role,
      roleKey: c.roleKey,
      venue: c.venue ?? null,
      venueNe: c.venueNe ?? null,
      bio: c.bio ?? null,
      order: c.order,
      highlighted: highlightedRoles.includes(c.roleKey),
      associationId: evaAssociation.id,
    })),
  });
  console.log(`   ✓ ${committee.length} committee members seeded\n`);

  // ── Seed Timeline → EVA Nepal ──────────────────────────────────────────────
  console.log("📜 Seeding timeline entries...");
  await prisma.timelineEntry.createMany({
    data: evaTimeline.map((t) => ({
      associationId: evaAssociation.id,
      year: t.year,
      title: t.title,
      description: t.description,
      stat: t.stat,
      highlighted: t.highlighted,
      order: t.order,
    })),
  });
  console.log(`   ✓ ${evaTimeline.length} timeline entries seeded\n`);

  // ── Seed Site Settings → EVA Nepal ────────────────────────────────────────
  console.log("⚙️  Seeding site settings...");
  const evaSettings = [
    { key: "contact_phone", value: "+977-XXXXXXXX", label: "Contact Phone", group: "contact" },
    { key: "contact_email", value: "info@evanepal.org", label: "Contact Email", group: "contact" },
    { key: "contact_address", value: "Maitidevi, Kathmandu, Nepal", label: "Office Address", group: "contact" },
    { key: "social_facebook", value: "https://facebook.com/evanepal", label: "Facebook URL", group: "social" },
    { key: "social_instagram", value: "https://instagram.com/evanepal", label: "Instagram URL", group: "social" },
    { key: "stats_events_hosted", value: "20000", label: "Events Hosted (stat)", group: "stats" },
  ];
  await prisma.siteSettings.createMany({
    data: evaSettings.map((s) => ({
      ...s,
      associationId: evaAssociation.id,
      updatedAt: new Date(),
    })),
  });
  console.log(`   ✓ ${evaSettings.length} settings seeded\n`);

  // ── Seed Admin Users ───────────────────────────────────────────────────────
  console.log("🔑 Seeding admin users...");
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.adminUser.create({
    data: {
      name: "EVA Nepal Admin",
      email: "admin@evanepal.org",
      password: hashedPassword,
      role: "admin",
      associationId: evaAssociation.id,
    },
  });

  await prisma.adminUser.create({
    data: {
      name: "Bhaktapur Admin",
      email: "admin@bhaktapurassociation.org",
      password: hashedPassword,
      role: "admin",
      associationId: bhaktapurAssociation.id,
    },
  });

  console.log("   ✓ admin@evanepal.org / admin123");
  console.log("   ✓ admin@bhaktapurassociation.org / admin123\n");

  // ── Seed Platform User (nibjar) ────────────────────────────────────────────
  console.log("🌐 Seeding platform user...");
  const platformHashedPassword = await bcrypt.hash("platform123", 12);

  await prisma.platformUser.create({
    data: {
      name: "Nibjar Platform Admin",
      email: "admin@nibjar.com",
      password: platformHashedPassword,
    },
  });

  console.log("   ✓ admin@nibjar.com / platform123\n");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("─────────────────────────────────────────");
  console.log("✅ Database seeded successfully!\n");
  console.log("   Associations : 2");
  console.log(`   Members      : ${createdEvaMembers.length} (EVA Nepal) + ${createdBhaktapurMembers.length} (Bhaktapur) = ${createdEvaMembers.length + createdBhaktapurMembers.length}`);
  console.log(`   Events       : ${events.length}`);
  console.log(`   News         : ${news.length}`);
  console.log(`   Committee    : ${committee.length}`);
  console.log(`   Timeline     : ${evaTimeline.length}`);
  console.log("─────────────────────────────────────────\n");
  console.log("⚠️  Change default passwords before going to production!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
