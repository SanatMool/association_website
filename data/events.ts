export interface Event {
  id: number;
  slug: string;
  title: string;
  titleNe: string;
  date: string;
  endDate?: string;
  location: string;
  type: "networking" | "training" | "meeting" | "exhibition" | "conference";
  status: "upcoming" | "past";
  description: string;
  image?: string;
}

export const events: Event[] = [
  {
    id: 1,
    slug: "annual-general-meeting-2025",
    title: "Annual General Meeting 2025",
    titleNe: "वार्षिक साधारण सभा २०२५",
    date: "2025-02-15",
    location: "Himalayan Convention Center, Kathmandu",
    type: "meeting",
    status: "upcoming",
    description:
      "The annual general meeting of EVA Nepal where members gather to review achievements, elect leadership, and plan the year ahead. All registered members are encouraged to attend.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
  },
  {
    id: 2,
    slug: "event-management-training-workshop-2025",
    title: "Event Management Training Workshop",
    titleNe: "इभेन्ट व्यवस्थापन तालिम कार्यशाला",
    date: "2025-03-10",
    endDate: "2025-03-12",
    location: "EVA Nepal Office, Maitidevi",
    type: "training",
    status: "upcoming",
    description:
      "A three-day intensive training workshop covering event planning, venue management, customer service excellence, and modern decoration techniques.",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
  },
  {
    id: 3,
    slug: "kathmandu-venue-expo-2025",
    title: "Kathmandu Venue Expo 2025",
    titleNe: "काठमाडौं भेन्यू एक्स्पो २०२५",
    date: "2025-04-20",
    endDate: "2025-04-22",
    location: "BhrikutiMandap, Kathmandu",
    type: "exhibition",
    status: "upcoming",
    description:
      "Nepal's largest event venue exhibition showcasing the best banquet halls, decoration services, and event technology. Open to the public and trade visitors.",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800",
  },
  {
    id: 4,
    slug: "venue-owners-networking-night-2025",
    title: "Venue Owners Networking Night",
    titleNe: "भेन्यू सञ्चालक नेटवर्किङ नाइट",
    date: "2025-05-15",
    location: "Royal Palace Banquet, Koteshwor",
    type: "networking",
    status: "upcoming",
    description:
      "An exclusive evening for EVA Nepal members to network, share experiences, and build relationships with fellow venue owners and suppliers.",
    image: "https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=800",
  },
  {
    id: 5,
    slug: "food-safety-hygiene-training-2025",
    title: "Food Safety & Hygiene Training",
    titleNe: "खाद्य सुरक्षा र स्वच्छता तालिम",
    date: "2025-06-05",
    location: "EVA Nepal Office, Maitidevi",
    type: "training",
    status: "upcoming",
    description:
      "A certified training program on food safety, kitchen hygiene, and catering standards for banquet hall staff and owners.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
  },
  {
    id: 6,
    slug: "annual-general-meeting-2024",
    title: "Annual General Meeting 2024",
    titleNe: "वार्षिक साधारण सभा २०२४",
    date: "2024-02-12",
    location: "Himalayan Convention Center, Kathmandu",
    type: "meeting",
    status: "past",
    description:
      "EVA Nepal's annual gathering where the 2023 achievements were reviewed and new initiatives for 2024 were announced.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
  },
  {
    id: 7,
    slug: "digital-marketing-for-venues-2024",
    title: "Digital Marketing for Venues",
    titleNe: "भेन्युहरूका लागि डिजिटल मार्केटिङ",
    date: "2024-04-18",
    location: "Diamond Hall, Naxal",
    type: "training",
    status: "past",
    description:
      "A workshop teaching venue owners how to leverage social media, Google Business, and online booking platforms to attract more clients.",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800",
  },
  {
    id: 8,
    slug: "venue-industry-conference-2024",
    title: "Nepal Venue Industry Conference 2024",
    titleNe: "नेपाल भेन्यू उद्योग सम्मेलन २०२४",
    date: "2024-08-22",
    endDate: "2024-08-23",
    location: "Himalayan Convention Center, Kathmandu",
    type: "conference",
    status: "past",
    description:
      "A two-day conference bringing together industry leaders, government officials, and venue operators to discuss the future of Nepal's event industry.",
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800",
  },
  {
    id: 9,
    slug: "event-decoration-workshop-2024",
    title: "Event Decoration & Styling Workshop",
    titleNe: "इभेन्ट सजावट र स्टाइलिङ कार्यशाला",
    date: "2024-10-10",
    location: "EVA Nepal Office, Maitidevi",
    type: "training",
    status: "past",
    description:
      "Hands-on workshop covering floral arrangements, lighting design, table settings, and modern wedding decoration trends.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
  },
  {
    id: 10,
    slug: "networking-gala-dinner-2024",
    title: "EVA Nepal Gala Dinner 2024",
    titleNe: "ईभीए नेपाल गाला डिनर २०२४",
    date: "2024-12-20",
    location: "Everest Banquet, New Baneshwor",
    type: "networking",
    status: "past",
    description:
      "The annual gala dinner celebrating another successful year for EVA Nepal and recognizing outstanding member venues.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
  },
];
