/**
 * seed-committee-history.ts
 *
 * Creates 3 past EVA Nepal executive committees (archived terms):
 *   2076 B.S. / 2019 A.D.
 *   2078 B.S. / 2021 A.D.
 *   2080 B.S. / 2023 A.D.
 *
 * Run: npx tsx prisma/seed-committee-history.ts
 *
 * Safe to run multiple times — uses upsert-like logic (checks for duplicates first).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EVA_ASSOCIATION_ID = "cmq6aarky00003vs6umm7b8xn";

// ─────────────────────────────────────────────────────────────────────────────
// Past committee data — 3 terms
// ─────────────────────────────────────────────────────────────────────────────

interface PastMember {
  name: string;
  nameNe?: string;
  role: string;
  roleKey: string;
  venue?: string;
  venueNe?: string;
  bio?: string;
  order: number;
  highlighted: boolean;
  termYearBS: number;
  termMonthBS: number;
  termYearAD: number;
  termMonthAD: number;
}

const pastTerms: PastMember[] = [

  // ── 2076 B.S. / 2019 A.D. ─────────────────────────────────────────────────
  {
    name:       "Ramesh Prasad Shrestha",
    nameNe:     "रमेश प्रसाद श्रेष्ठ",
    role:       "President",
    roleKey:    "president",
    venue:      "Shrestha Party Palace",
    venueNe:    "श्रेष्ठ पार्टी प्यालेस",
    order:      1,
    highlighted: true,
    bio:        "Ramesh Prasad Shrestha served as President of EVA Nepal from 2076–2078 B.S., leading the association through a period of rapid membership growth and quality standardization initiatives.",
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Hari Bahadur Maharjan",
    nameNe:     "हरि बहादुर महर्जन",
    role:       "Senior Vice President",
    roleKey:    "senior_vice_president",
    venue:      "Maharjan Banquet",
    venueNe:    "महर्जन बैंक्वेट",
    order:      2,
    highlighted: true,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Sunita Khadka",
    nameNe:     "सुनिता खड्का",
    role:       "General Secretary",
    roleKey:    "general_secretary",
    venue:      "Khadka Event Hall",
    venueNe:    "खड्का इभेन्ट हल",
    order:      3,
    highlighted: true,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Bikash Tamrakar",
    nameNe:     "विकास ताम्राकार",
    role:       "Treasurer",
    roleKey:    "treasurer",
    venue:      "Tamrakar Garden Hall",
    order:      4,
    highlighted: true,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Laxmi Prasad Pandey",
    nameNe:     "लक्ष्मी प्रसाद पाण्डेय",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Pandey Community Hall",
    order:      5,
    highlighted: false,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Mina Bajracharya",
    nameNe:     "मिना बज्राचार्य",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Bajracharya Celebration Hall",
    venueNe:    "बज्राचार्य सेलिब्रेसन हल",
    order:      6,
    highlighted: false,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Narendra Kumar Rai",
    nameNe:     "नरेन्द्र कुमार राई",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Rai Palace",
    order:      7,
    highlighted: false,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Prem Bahadur Gurung",
    nameNe:     "प्रेम बहादुर गुरुङ",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Gurung Banquet and Events",
    order:      8,
    highlighted: false,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },
  {
    name:       "Sabita Karmacharya",
    nameNe:     "सबिता कर्माचार्य",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Karmacharya Function House",
    venueNe:    "कर्माचार्य फंक्सन हाउस",
    order:      9,
    highlighted: false,
    termYearBS: 2076, termMonthBS: 3, termYearAD: 2019, termMonthAD: 6,
  },

  // ── 2078 B.S. / 2021 A.D. ─────────────────────────────────────────────────
  {
    name:       "Sanjay Kumar Shrestha",
    nameNe:     "सञ्जय कुमार श्रेष्ठ",
    role:       "President",
    roleKey:    "president",
    venue:      "Sanjay Grand Banquet",
    venueNe:    "सञ्जय ग्र्यान्ड बैंक्वेट",
    order:      1,
    highlighted: true,
    bio:        "Sanjay Kumar Shrestha led EVA Nepal through the post-pandemic recovery period, spearheading the digital directory initiative and government advocacy for the event industry.",
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Ramesh Prasad Shrestha",
    nameNe:     "रमेश प्रसाद श्रेष्ठ",
    role:       "Immediate Past President",
    roleKey:    "immediate_past_president",
    venue:      "Shrestha Party Palace",
    venueNe:    "श्रेष्ठ पार्टी प्यालेस",
    order:      2,
    highlighted: true,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Deepak Manandhar",
    nameNe:     "दिपक मानन्धर",
    role:       "Senior Vice President",
    roleKey:    "senior_vice_president",
    venue:      "Manandhar Events",
    venueNe:    "मानन्धर इभेन्ट्स",
    order:      3,
    highlighted: true,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Anita Pradhan",
    nameNe:     "अनिता प्रधान",
    role:       "General Secretary",
    roleKey:    "general_secretary",
    venue:      "Pradhan Hall",
    venueNe:    "प्रधान हल",
    order:      4,
    highlighted: true,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Kedar Nath Joshi",
    nameNe:     "केदार नाथ जोशी",
    role:       "Treasurer",
    roleKey:    "treasurer",
    venue:      "Joshi Banquet Hall",
    order:      5,
    highlighted: true,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Binod Kumar Acharya",
    nameNe:     "विनोद कुमार आचार्य",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Acharya Party Palace",
    order:      6,
    highlighted: false,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Shova Thapa",
    nameNe:     "शोभा थापा",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Thapa Celebration Center",
    venueNe:    "थापा सेलिब्रेसन सेन्टर",
    order:      7,
    highlighted: false,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Gokarna Prasad Neupane",
    nameNe:     "गोकर्ण प्रसाद न्यौपाने",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Neupane Events",
    order:      8,
    highlighted: false,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },
  {
    name:       "Pratibha Kafle",
    nameNe:     "प्रतिभा काफ्ले",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Kafle Function Hall",
    order:      9,
    highlighted: false,
    termYearBS: 2078, termMonthBS: 2, termYearAD: 2021, termMonthAD: 5,
  },

  // ── 2080 B.S. / 2023 A.D. ─────────────────────────────────────────────────
  {
    name:       "Mohan Lal Shrestha",
    nameNe:     "मोहन लाल श्रेष्ठ",
    role:       "President",
    roleKey:    "president",
    venue:      "Shrestha Grand Hall",
    venueNe:    "श्रेष्ठ ग्र्यान्ड हल",
    order:      1,
    highlighted: true,
    bio:        "Mohan Lal Shrestha served as President of EVA Nepal from 2080–2082 B.S., overseeing the launch of the training programs and the association's 150+ member milestone campaign.",
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Sanjay Kumar Shrestha",
    nameNe:     "सञ्जय कुमार श्रेष्ठ",
    role:       "Immediate Past President",
    roleKey:    "immediate_past_president",
    venue:      "Sanjay Grand Banquet",
    venueNe:    "सञ्जय ग्र्यान्ड बैंक्वेट",
    order:      2,
    highlighted: true,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Krishna Prasad Parajuli",
    nameNe:     "कृष्ण प्रसाद पराजुली",
    role:       "Senior Vice President",
    roleKey:    "senior_vice_president",
    venue:      "Parajuli Banquet",
    venueNe:    "पराजुली बैंक्वेट",
    order:      3,
    highlighted: true,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Bishnu Maya Maharjan",
    nameNe:     "विष्णुमाया महर्जन",
    role:       "Vice President",
    roleKey:    "vice_president",
    venue:      "Maharjan Party Palace",
    venueNe:    "महर्जन पार्टी प्यालेस",
    order:      4,
    highlighted: true,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Ramkumar Thakur",
    nameNe:     "रामकुमार ठाकुर",
    role:       "General Secretary",
    roleKey:    "general_secretary",
    venue:      "Thakur Event Center",
    venueNe:    "ठाकुर इभेन्ट सेन्टर",
    order:      5,
    highlighted: true,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Tulsi Ram Adhikari",
    nameNe:     "तुलसी राम अधिकारी",
    role:       "Treasurer",
    roleKey:    "treasurer",
    venue:      "Adhikari Hall",
    order:      6,
    highlighted: true,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Saru Shrestha",
    nameNe:     "सरु श्रेष्ठ",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Shrestha Community Hall",
    order:      7,
    highlighted: false,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Dinesh Rajbhandari",
    nameNe:     "दिनेश राजभण्डारी",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Rajbhandari Banquet",
    venueNe:    "राजभण्डारी बैंक्वेट",
    order:      8,
    highlighted: false,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Pabita Karki",
    nameNe:     "पबिता कार्की",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Karki Function Palace",
    order:      9,
    highlighted: false,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
  {
    name:       "Suresh Kumar Tamang",
    nameNe:     "सुरेश कुमार तामाङ",
    role:       "Executive Member",
    roleKey:    "member",
    venue:      "Tamang Event Hall",
    order:      10,
    highlighted: false,
    termYearBS: 2080, termMonthBS: 4, termYearAD: 2023, termMonthAD: 7,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🏛  Seeding EVA Nepal committee history...\n");

  // Check if any past committee records already exist (idempotency guard)
  const existing = await prisma.committeeMember.count({
    where: { associationId: EVA_ASSOCIATION_ID, active: false },
  });

  if (existing > 0) {
    console.log(`⚠️  ${existing} archived committee records already exist. Skipping seed.`);
    console.log("   To re-seed, delete existing archived records first.");
    return;
  }

  const created = await prisma.committeeMember.createMany({
    data: pastTerms.map((m) => ({
      name:        m.name,
      nameNe:      m.nameNe ?? null,
      role:        m.role,
      roleKey:     m.roleKey,
      venue:       m.venue ?? null,
      venueNe:     m.venueNe ?? null,
      bio:         m.bio ?? null,
      order:       m.order,
      highlighted: m.highlighted,
      active:      false,   // archived — does NOT appear on current committee page
      termYearBS:  m.termYearBS,
      termMonthBS: m.termMonthBS,
      termYearAD:  m.termYearAD,
      termMonthAD: m.termMonthAD,
      associationId: EVA_ASSOCIATION_ID,
    })),
  });

  const terms = [...new Set(pastTerms.map((m) => m.termYearBS))];
  console.log(`✅  Created ${created.count} archived committee members`);
  console.log(`   Across ${terms.length} terms: ${terms.join(", ")} B.S.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
