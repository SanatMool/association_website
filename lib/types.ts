// Serializable types shared between static data and DB-backed pages
// Dates are always ISO strings for safe server→client serialization

export interface MemberType {
  id: string | number;
  slug: string;
  name: string;
  location?: string | null;
  area: string;
  capacity: number;
  phone: string;
  website?: string | null;
  category?: string | null;
  type?: string | null;
  description?: string | null;
  amenities?: string[];
  memberSince?: string | null;
  featured?: boolean | null;
  image?: string | null;
}

export interface EventType {
  id: string | number;
  slug: string;
  title: string;
  titleNe?: string | null;
  description: string;
  date: string; // ISO string
  endDate?: string | null;
  location: string;
  type: string;
  status: string;
  image?: string | null;
}

export interface NewsType {
  id: string | number;
  slug: string;
  title: string;
  titleNe?: string | null;
  excerpt: string;
  content?: string;
  date: string; // ISO string
  category: string;
  author: string;
  image?: string | null;
  featured?: boolean | null;
}

export interface CommitteeType {
  id: string | number;
  name: string;
  role: string;
  roleKey: string;
  venue?: string | null;
  bio?: string | null;
  order: number;
  highlighted?: boolean;
  image?: string | null;
}
