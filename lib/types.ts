// Serializable types shared between DB-backed pages and components.
// Dates are always ISO strings for safe server→client serialization.
// These are NOT Prisma models — they are lean, serializable interfaces.

export interface MemberType {
  id: string | number;
  slug: string;
  name: string;
  nameNe?: string | null;
  location?: string | null;
  area: string;
  capacity?: number | null;  // nullable — some associations don't track capacity
  phone?: string | null;
  website?: string | null;
  category?: string | null;
  type?: string | null;
  description?: string | null;
  amenities?: string[];
  memberSince?: string | null;
  featured?: boolean | null;
  image?: string | null;
  ownerName?: string | null;
  ownerNameNe?: string | null;
  addressNe?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EventType {
  id: string | number;
  slug: string;
  title: string;
  titleNe?: string | null;
  description: string;
  date: string; // ISO string
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  type: string;
  status: string;
  attendees?: number | null;
  image?: string | null;
}

export interface NewsType {
  id: string | number;
  slug: string;
  title: string;
  titleNe?: string | null;
  excerpt: string;
  content?: string;
  date: string; // ISO string — maps to publishedAt
  category: string;
  author: string;
  image?: string | null;
  featured?: boolean | null;
}

export interface CommitteeType {
  id: string | number;
  name: string;
  nameNe?: string | null;
  role: string;
  roleKey: string;
  venue?: string | null;
  venueNe?: string | null;
  organization?: string | null;
  bio?: string | null;
  order: number;
  highlighted?: boolean;
  image?: string | null;
  termYearAD?: number | null;
  termMonthAD?: number | null;
  termYearBS?: number | null;
  termMonthBS?: number | null;
}

export interface TimelineType {
  id: string;
  year: number;
  title: string;
  titleNe?: string | null;
  description: string;
  descriptionNe?: string | null;
  stat?: string | null;
  highlighted: boolean;
  order: number;
}

export interface AssociationType {
  id: string;
  name: string;
  nameNe?: string | null;
  slug: string;
  domain: string;
  logo?: string | null;
  themeColor: string;
  accentColor: string;
  foundedYear?: number | null;
  description?: string | null;
  descriptionNe?: string | null;
}
