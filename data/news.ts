export interface NewsItem {
  id: number;
  slug: string;
  title: string;
  titleNe: string;
  excerpt: string;
  content: string;
  date: string;
  category: "announcement" | "training" | "event" | "industry" | "member";
  author: string;
  image?: string;
}

export const news: NewsItem[] = [
  {
    id: 1,
    slug: "eva-nepal-celebrates-14-years",
    title: "EVA Nepal Celebrates 14 Years of Representing Nepal's Event Industry",
    titleNe: "ईभीए नेपालले नेपालको इभेन्ट उद्योगको प्रतिनिधित्वका १४ वर्ष मनायो",
    excerpt:
      "The Event and Venue Association Nepal marks another milestone year, celebrating 14 years of dedicated service to Kathmandu's event and venue industry.",
    content:
      "The Event and Venue Association Nepal (EVA Nepal) has reached a proud milestone, celebrating 14 years since its establishment in 2011. Over the years, the association has grown from a small group of venue owners to a comprehensive body representing over 150 member venues across the Kathmandu Valley...",
    date: "2025-01-15",
    category: "announcement",
    author: "EVA Nepal Secretariat",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
  },
  {
    id: 2,
    slug: "event-management-training-program-registration-open",
    title: "Registration Open: Event Management Training Program March 2025",
    titleNe: "दर्ता खुला: इभेन्ट व्यवस्थापन तालिम कार्यक्रम मार्च २०२५",
    excerpt:
      "EVA Nepal announces registration for its upcoming three-day event management training workshop. Limited seats available for member venues.",
    content:
      "EVA Nepal is pleased to announce that registration is now open for the Event Management Training Workshop scheduled for March 10-12, 2025. This intensive three-day program will cover event planning fundamentals, venue management best practices, customer service excellence, and modern decoration techniques...",
    date: "2025-01-28",
    category: "training",
    author: "Training Committee",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
  },
  {
    id: 3,
    slug: "kathmandu-venue-expo-2025-announced",
    title: "Kathmandu Venue Expo 2025 to Feature 50+ Member Venues",
    titleNe: "काठमाडौं भेन्यू एक्स्पो २०२५ मा ५०+ सदस्य भेन्युहरू सहभागी हुनेछन्",
    excerpt:
      "Nepal's largest event venue exhibition is set for April 20-22, 2025, at BhrikutiMandap. Over 50 member venues will showcase their facilities.",
    content:
      "The Kathmandu Venue Expo 2025 is shaping up to be the biggest ever, with confirmed participation from over 50 EVA Nepal member venues. The three-day expo at BhrikutiMandap will feature live demonstrations, special package offers, and opportunities for couples and event planners to explore venues...",
    date: "2025-02-05",
    category: "event",
    author: "Events Committee",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800",
  },
  {
    id: 4,
    slug: "new-quality-standards-for-member-venues",
    title: "EVA Nepal Launches New Quality Standards Framework for Member Venues",
    titleNe: "ईभीए नेपालले सदस्य भेन्युहरूका लागि नयाँ गुणस्तर मापदण्ड ढाँचा सुरु गर्यो",
    excerpt:
      "The association has developed a comprehensive quality assessment framework to ensure consistent service standards across all member venues.",
    content:
      "EVA Nepal has introduced a new Quality Standards Framework (QSF) that sets clear benchmarks for service quality, hygiene, safety, and customer experience across member venues. The framework was developed in consultation with industry experts and member representatives...",
    date: "2025-02-12",
    category: "announcement",
    author: "Quality Standards Committee",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
  },
  {
    id: 5,
    slug: "welcome-new-members-2025",
    title: "EVA Nepal Welcomes 12 New Member Venues in Early 2025",
    titleNe: "ईभीए नेपालले २०२५ को सुरुमा १२ नयाँ सदस्य भेन्युहरूलाई स्वागत गर्दछ",
    excerpt:
      "The association continues to grow with 12 new venues joining the EVA Nepal family in the first quarter of 2025.",
    content:
      "EVA Nepal is delighted to welcome 12 new member venues to the association in early 2025. These new members span across Kathmandu, Patan, and Bhaktapur, further strengthening the association's representation across the valley...",
    date: "2025-02-20",
    category: "member",
    author: "Membership Committee",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
  },
  {
    id: 6,
    slug: "venue-industry-growth-2024-report",
    title: "Kathmandu Event Venue Industry Sees Strong Growth in 2024",
    titleNe: "काठमाडौं इभेन्ट भेन्यू उद्योगले २०२४ मा मजबुत वृद्धि देख्यो",
    excerpt:
      "A new industry report shows that Kathmandu's event venue sector experienced significant growth in 2024, with wedding events leading the recovery.",
    content:
      "The event venue industry in Kathmandu witnessed a remarkable recovery and growth in 2024, with the sector seeing a significant increase in bookings and revenue. According to data compiled by EVA Nepal, member venues reported higher booking rates compared to previous years...",
    date: "2025-01-10",
    category: "industry",
    author: "Research & Development",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
  },
];
