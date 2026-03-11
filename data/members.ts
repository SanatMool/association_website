export interface Member {
  id: number;
  slug: string;
  name: string;
  location: string;
  area: string;
  capacity: number;
  phone: string;
  website: string;
  category: string;
  description: string;
  amenities: string[];
  memberSince: string;
  featured?: boolean;
}

export const members: Member[] = [
  {
    id: 1,
    slug: "viva-event-and-convention",
    name: "Viva Event and Convention",
    location: "Teku, Kathmandu",
    area: "Teku",
    capacity: 1000,
    phone: "9851328911",
    website: "cater-web.nibjar.com",
    category: "Convention Center",
    description: "A premier convention center in Teku offering world-class facilities for large-scale events, weddings, and corporate gatherings.",
    amenities: ["AC Hall", "Parking", "Catering", "AV System", "Stage", "Green Room"],
    memberSince: "2011",
    featured: true,
  },
  {
    id: 2,
    slug: "paradise-banquet",
    name: "Paradise Banquet",
    location: "Khusibu, Kathmandu",
    area: "Khusibu",
    capacity: 1000,
    phone: "9851328911",
    website: "cater-web.nibjar.com",
    category: "Banquet Hall",
    description: "Paradise Banquet is a luxurious venue in Khusibu perfect for grand weddings, receptions, and social events.",
    amenities: ["AC Hall", "Parking", "Catering", "Bridal Room", "Decoration", "Sound System"],
    memberSince: "2012",
    featured: true,
  },
  {
    id: 3,
    slug: "yeti-events",
    name: "Yeti Events",
    location: "Balaju, Kathmandu",
    area: "Balaju",
    capacity: 600,
    phone: "9851328911",
    website: "cater-web.nibjar.com",
    category: "Event Venue",
    description: "Yeti Events offers a spacious and elegant venue in Balaju, ideal for weddings, receptions, and corporate events.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage", "Lighting", "Sound"],
    memberSince: "2013",
    featured: true,
  },
  {
    id: 4,
    slug: "classic-banquet",
    name: "Classic Banquet",
    location: "Khusibu, Kathmandu",
    area: "Khusibu",
    capacity: 600,
    phone: "9851328911",
    website: "cater-web.nibjar.com",
    category: "Banquet Hall",
    description: "Classic Banquet provides timeless elegance for your special occasions in the heart of Khusibu.",
    amenities: ["AC Hall", "Parking", "Catering", "Bridal Suite", "Garden Area"],
    memberSince: "2013",
  },
  {
    id: 5,
    slug: "thapa-gaun-banquet",
    name: "Thapa Gaun Banquet",
    location: "Anamnagar, Kathmandu",
    area: "Anamnagar",
    capacity: 600,
    phone: "9851328911",
    website: "cater-web.nibjar.com",
    category: "Banquet Hall",
    description: "Thapa Gaun Banquet is a charming venue in Anamnagar known for its warm hospitality and excellent service.",
    amenities: ["AC Hall", "Parking", "In-house Catering", "Stage", "Decoration"],
    memberSince: "2014",
  },
  {
    id: 6,
    slug: "f10-banquet",
    name: "F10 Banquet",
    location: "Teku, Kathmandu",
    area: "Teku",
    capacity: 600,
    phone: "9851328911",
    website: "cater-web.nibjar.com",
    category: "Banquet Hall",
    description: "F10 Banquet in Teku offers a modern and stylish venue for all types of events and celebrations.",
    amenities: ["AC Hall", "Parking", "Catering", "AV Setup", "Stage"],
    memberSince: "2014",
  },
  {
    id: 7,
    slug: "royal-palace-banquet",
    name: "Royal Palace Banquet",
    location: "Koteshwor, Kathmandu",
    area: "Koteshwor",
    capacity: 800,
    phone: "9841234567",
    website: "royalpalace.com.np",
    category: "Banquet Hall",
    description: "Royal Palace Banquet offers regal settings for your grand events in Koteshwor.",
    amenities: ["AC Hall", "Valet Parking", "Premium Catering", "Bridal Suite", "Garden"],
    memberSince: "2011",
    featured: true,
  },
  {
    id: 8,
    slug: "crystal-hall",
    name: "Crystal Hall",
    location: "Baneshwor, Kathmandu",
    area: "Baneshwor",
    capacity: 500,
    phone: "9841345678",
    website: "crystalhall.com.np",
    category: "Event Hall",
    description: "Crystal Hall offers modern event spaces with crystal-clear acoustics in Baneshwor.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage", "LED Lighting"],
    memberSince: "2015",
  },
  {
    id: 9,
    slug: "grand-celebration-hall",
    name: "Grand Celebration Hall",
    location: "Chabahil, Kathmandu",
    area: "Chabahil",
    capacity: 700,
    phone: "9851456789",
    website: "grandcelebration.com.np",
    category: "Banquet Hall",
    description: "Grand Celebration Hall is the destination for unforgettable events in Chabahil.",
    amenities: ["AC Hall", "Parking", "Catering", "Bridal Room", "Garden", "Stage"],
    memberSince: "2012",
  },
  {
    id: 10,
    slug: "everest-banquet",
    name: "Everest Banquet",
    location: "New Baneshwor, Kathmandu",
    area: "Baneshwor",
    capacity: 900,
    phone: "9851567890",
    website: "everestbanquet.com.np",
    category: "Banquet Hall",
    description: "Everest Banquet stands tall in New Baneshwor, offering spacious halls for large gatherings.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage", "Sound System", "Projector"],
    memberSince: "2011",
    featured: true,
  },
  {
    id: 11,
    slug: "golden-gate-banquet",
    name: "Golden Gate Banquet",
    location: "Gongabu, Kathmandu",
    area: "Gongabu",
    capacity: 550,
    phone: "9841678901",
    website: "goldengate.com.np",
    category: "Banquet Hall",
    description: "Golden Gate Banquet opens its doors to memorable celebrations in Gongabu.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage"],
    memberSince: "2016",
  },
  {
    id: 12,
    slug: "heritage-event-center",
    name: "Heritage Event Center",
    location: "Patan, Lalitpur",
    area: "Patan",
    capacity: 450,
    phone: "9841789012",
    website: "heritageevent.com.np",
    category: "Event Center",
    description: "Heritage Event Center blends traditional Newari architecture with modern event facilities in Patan.",
    amenities: ["AC Hall", "Parking", "Catering", "Cultural Décor", "Stage"],
    memberSince: "2013",
  },
  {
    id: 13,
    slug: "siddhartha-banquet",
    name: "Siddhartha Banquet",
    location: "Kalanki, Kathmandu",
    area: "Kalanki",
    capacity: 600,
    phone: "9851890123",
    website: "siddharthabanquet.com.np",
    category: "Banquet Hall",
    description: "Siddhartha Banquet offers elegant spaces for weddings and social events in Kalanki.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage", "Garden"],
    memberSince: "2014",
  },
  {
    id: 14,
    slug: "sunrise-event-hall",
    name: "Sunrise Event Hall",
    location: "Naya Bazar, Kathmandu",
    area: "Naya Bazar",
    capacity: 400,
    phone: "9841901234",
    website: "sunriseevent.com.np",
    category: "Event Hall",
    description: "Sunrise Event Hall brings a bright start to every occasion in Naya Bazar.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage"],
    memberSince: "2017",
  },
  {
    id: 15,
    slug: "himalayan-convention-center",
    name: "Himalayan Convention Center",
    location: "Soaltee Mode, Kathmandu",
    area: "Soaltee Mode",
    capacity: 1200,
    phone: "9851012345",
    website: "himalayanconvention.com.np",
    category: "Convention Center",
    description: "The Himalayan Convention Center is one of Kathmandu's largest venues for conferences, exhibitions, and grand events.",
    amenities: ["AC Hall", "Valet Parking", "Premium Catering", "Stage", "AV System", "Business Center"],
    memberSince: "2011",
    featured: true,
  },
  {
    id: 16,
    slug: "lumbini-banquet",
    name: "Lumbini Banquet",
    location: "Bouddha, Kathmandu",
    area: "Bouddha",
    capacity: 500,
    phone: "9851123456",
    website: "lumbinibanquet.com.np",
    category: "Banquet Hall",
    description: "Lumbini Banquet near Bouddha Stupa offers serene surroundings for your events.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage", "Decoration"],
    memberSince: "2015",
  },
  {
    id: 17,
    slug: "orchid-event-center",
    name: "Orchid Event Center",
    location: "Bansbari, Kathmandu",
    area: "Bansbari",
    capacity: 350,
    phone: "9841234560",
    website: "orchidevent.com.np",
    category: "Event Center",
    description: "Orchid Event Center offers intimate and elegant settings for smaller celebrations.",
    amenities: ["AC Hall", "Parking", "Catering", "Garden"],
    memberSince: "2018",
  },
  {
    id: 18,
    slug: "sapphire-banquet",
    name: "Sapphire Banquet",
    location: "Maharajgunj, Kathmandu",
    area: "Maharajgunj",
    capacity: 650,
    phone: "9851345670",
    website: "sapphirebanquet.com.np",
    category: "Banquet Hall",
    description: "Sapphire Banquet glitters with luxury in the upscale Maharajgunj area.",
    amenities: ["AC Hall", "Valet Parking", "Premium Catering", "Bridal Suite", "Stage"],
    memberSince: "2013",
  },
  {
    id: 19,
    slug: "tulsi-event-palace",
    name: "Tulsi Event Palace",
    location: "Kapan, Kathmandu",
    area: "Kapan",
    capacity: 400,
    phone: "9841456780",
    website: "tulsievent.com.np",
    category: "Event Palace",
    description: "Tulsi Event Palace in Kapan provides a warm and welcoming environment for all celebrations.",
    amenities: ["AC Hall", "Parking", "Catering", "Stage", "Garden"],
    memberSince: "2016",
  },
  {
    id: 20,
    slug: "diamond-hall",
    name: "Diamond Hall",
    location: "Naxal, Kathmandu",
    area: "Naxal",
    capacity: 700,
    phone: "9851567891",
    website: "diamondhall.com.np",
    category: "Event Hall",
    description: "Diamond Hall in Naxal sparkles with elegance for your most precious occasions.",
    amenities: ["AC Hall", "Parking", "Premium Catering", "Stage", "LED Walls"],
    memberSince: "2012",
    featured: true,
  },
  ...generateAdditionalMembers(),
];

function generateAdditionalMembers(): Member[] {
  const areas = [
    "Thamel", "Lazimpat", "Dillibazar", "Putalisadak", "Patan",
    "Bhaktapur", "Kirtipur", "Tokha", "Budhanilkantha", "Sundarijal",
    "Jorpati", "Gokarneshwor", "Sankhu", "Boudha", "Pashupatinath",
    "Sinamangal", "Gaushala", "Dhumbarahi", "Chakrapath", "Samakhusi",
    "Swayambhu", "Thankot", "Dahachok", "Satdobato", "Imadol",
    "Lubhu", "Godawari", "Harisiddhi", "Thecho", "Bungamati",
  ];

  const categories = [
    "Banquet Hall", "Event Venue", "Convention Center",
    "Event Palace", "Wedding Hall", "Party Hall", "Event Center",
  ];

  const amenitySets = [
    ["AC Hall", "Parking", "Catering", "Stage"],
    ["AC Hall", "Parking", "Catering", "Bridal Suite", "Garden"],
    ["AC Hall", "Valet Parking", "Premium Catering", "Stage", "AV System"],
    ["AC Hall", "Parking", "Catering", "Stage", "Sound System"],
    ["AC Hall", "Parking", "Catering", "Garden", "Decoration"],
  ];

  const prefixes = [
    "Amar", "Annapurna", "Bagmati", "Basanta", "Chandragiri",
    "Deurali", "Fishtail", "Gauri", "Hotel", "Indira",
    "Janaki", "Kailash", "Laligurans", "Machhapuchhre", "Namaste",
    "Om", "Pashupati", "Rastriya", "Sagarmatha", "Triveni",
    "Uma", "Vijaya", "Welcome", "Xenith", "Yasoda",
    "Zenith", "Aarav", "Birat", "Chitwan", "Devi",
  ];

  const suffixes = [
    "Banquet", "Event Hall", "Convention", "Party Palace", "Wedding Hall",
    "Grand Hall", "Event Center", "Celebration Hall", "Banquet Hall", "Events",
  ];

  const additional: Member[] = [];

  for (let i = 21; i <= 155; i++) {
    const prefix = prefixes[(i - 21) % prefixes.length];
    const suffix = suffixes[(i - 21) % suffixes.length];
    const area = areas[(i - 21) % areas.length];
    const category = categories[i % categories.length];
    const amenities = amenitySets[i % amenitySets.length];
    const capacity = [300, 400, 500, 600, 700, 800, 900, 1000][i % 8];
    const memberSince = String(2011 + ((i - 21) % 10));

    additional.push({
      id: i,
      slug: `${prefix.toLowerCase()}-${suffix.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${prefix} ${suffix}`,
      location: `${area}, Kathmandu`,
      area,
      capacity,
      phone: `985${String(1000000 + i).slice(1)}`,
      website: `cater-web.nibjar.com`,
      category,
      description: `${prefix} ${suffix} in ${area} is a distinguished event venue offering exceptional hospitality and professional event services for all occasions.`,
      amenities,
      memberSince,
    });
  }

  return additional;
}

export const getAreaList = (): string[] => {
  const areas = [...new Set(members.map((m) => m.area))];
  return areas.sort();
};

export const getMemberBySlug = (slug: string): Member | undefined => {
  return members.find((m) => m.slug === slug);
};
