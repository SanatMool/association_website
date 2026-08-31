export type Locale = "en" | "ne";
export type MemberMode = "venue" | "person";

export const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      members: "Members",
      events: "Events",
      news: "News",
      committee: "Committee",
      join: "Join",
      contact: "Contact",
    },
    hero: {
      venue: {
        subtitle: "Representing the Future of Event Spaces in Nepal",
        description:
          "The leading association uniting banquet halls, wedding venues, and event infrastructure providers across Kathmandu Valley.",
        cta_primary: "Explore Members",
        stats_members: "Member Venues",
        stats_years: "Years of Excellence",
        stats_events: "Annual Events",
        stats_coverage: "Valley Coverage",
      },
      person: {
        subtitle: "Connecting Nepal's Professional Community",
        description:
          "The leading association uniting individual professionals and industry experts across Kathmandu Valley.",
        cta_primary: "Explore Members",
        stats_members: "Members",
        stats_years: "Years of Excellence",
        stats_events: "Annual Events",
        stats_coverage: "Valley Coverage",
      },
    },
    about: {
      venue: {
        title: "Leading Nepal's Event Industry Forward",
        description:
          "This association is the premier body representing event venues and infrastructure providers in the region — a unified voice for our members' shared growth and industry standards.",
        established: "Established",
        hq: "Headquarters",
        coverage: "Coverage",
      },
      person: {
        title: "Leading Nepal's Professional Community Forward",
        description:
          "This association is the premier body representing individual professionals and industry experts in the region — a unified voice for our members' shared growth and recognition.",
        established: "Established",
        hq: "Headquarters",
        coverage: "Coverage",
      },
    },
    mission: {
      venue: {
        label: "Our Mission",
        title: "Strengthening the Event Industry Together",
        items: [
          { title: "Industry Representation", desc: "We advocate for venue owners and event businesses at industry and governmental forums." },
          { title: "Quality Standards", desc: "We establish and uphold service quality benchmarks across member venues." },
          { title: "Industry Promotion", desc: "We actively promote Nepal's event industry locally and internationally." },
          { title: "Networking", desc: "We create meaningful connections between venue owners, suppliers, and clients." },
          { title: "Training & Development", desc: "We organize workshops and training programs to elevate industry skills." },
          { title: "Collective Growth", desc: "We foster collaboration among members for shared success and growth." },
        ],
      },
      person: {
        label: "Our Mission",
        title: "Strengthening Our Community Together",
        items: [
          { title: "Professional Representation", desc: "We advocate for our members' interests at industry and governmental forums." },
          { title: "Quality Standards", desc: "We establish and uphold professional standards and best practices among members." },
          { title: "Industry Promotion", desc: "We actively promote our members' work and expertise locally and internationally." },
          { title: "Networking", desc: "We create meaningful connections between members, partners, and clients." },
          { title: "Training & Development", desc: "We organize workshops and training programs to elevate members' skills." },
          { title: "Collective Growth", desc: "We foster collaboration among members for shared success and growth." },
        ],
      },
    },
    members: {
      venue: {
        label: "Member Directory",
        title: "Our Member Venues",
        search_placeholder: "Search venues by name or location...",
        view_profile: "View Profile",
        guests: "guests",
      },
      person: {
        label: "Member Directory",
        title: "Our Members",
        search_placeholder: "Search members by name or location...",
        view_profile: "View Profile",
        guests: "guests",
      },
      filter_all: "All Areas",
      capacity: "Capacity",
      phone: "Phone",
      website: "Website",
    },
    whyjoin: {
      venue: {
        subtitle: "Join Nepal's premier event venue association and elevate your business.",
        benefits: [
          { title: "Industry Recognition", desc: "Get official recognition as a certified member of Nepal's leading venue association." },
          { title: "Networking Opportunities", desc: "Connect with fellow venue owners, suppliers, and event professionals." },
          { title: "Training Programs", desc: "Access exclusive workshops, skill development, and industry training sessions." },
          { title: "Collective Representation", desc: "Have your interests represented at industry meetings and government forums." },
          { title: "Member Directory", desc: "Get listed on our official member directory, boosting your venue's visibility." },
          { title: "Priority Support", desc: "Receive priority assistance with industry challenges and regulatory matters." },
        ],
      },
      person: {
        subtitle: "Join Nepal's premier professional association and grow your career.",
        benefits: [
          { title: "Industry Recognition", desc: "Get official recognition as a certified member of a leading professional association." },
          { title: "Networking Opportunities", desc: "Connect with fellow members, partners, and industry professionals." },
          { title: "Training Programs", desc: "Access exclusive workshops, skill development, and professional training sessions." },
          { title: "Collective Representation", desc: "Have your interests represented at industry meetings and government forums." },
          { title: "Member Directory", desc: "Get listed on our official member directory, boosting your visibility." },
          { title: "Priority Support", desc: "Receive priority assistance with professional challenges and regulatory matters." },
        ],
      },
    },
    events: {
      label: "Events & Activities",
      title: "What We Do",
      subtitle: "Bringing our community together through meaningful programs",
      upcoming: "Upcoming",
      past: "Past Events",
      view_all: "View All Events",
    },
    news: {
      label: "News & Announcements",
      title: "Latest News",
      subtitle: "Stay updated with industry news, announcements, and association updates",
      read_more: "Read More",
      view_all: "View All News",
    },
    committee: {
      label: "Executive Committee",
      title: "Our Leadership",
      subtitle: "Experienced leaders guiding our community",
      president: "President",
      immediate_past_president: "Immediate Past President",
      senior_vice_president: "Senior Vice President",
      vice_president: "Vice President",
      general_secretary: "General Secretary",
      secretary: "Secretary",
      treasurer: "Treasurer",
      member: "Committee Member",
    },
    join: {
      label: "Membership Application",
      title: "Become a Member",
      subtitle: "Join our association and be part of the official member community",
      venue_name: "Venue Name",
      owner_name: "Owner / Manager Name",
      phone: "Phone Number",
      email: "Email Address",
      location: "Location / Address",
      capacity: "Venue Capacity",
      website: "Website (Optional)",
      submit: "Submit Application",
      success: "Application submitted successfully! We will contact you soon.",
      required: "Required field",
    },
    contact: {
      label: "Get in Touch",
      title: "Contact Us",
      address: "Kathmandu, Nepal",
      phone: "+977-1-XXXXXXX",
      email: "info@example.org",
      follow: "Follow Us",
    },
    footer: {
      venue: { tagline: "Representing the Future of Event Spaces in Nepal" },
      person: { tagline: "Connecting Nepal's Professional Community" },
      quick_links: "Quick Links",
      contact_info: "Contact Info",
      follow_us: "Follow Us",
      rights: "All rights reserved.",
    },
  },
  ne: {
    nav: {
      home: "गृहपृष्ठ",
      about: "हाम्रोबारे",
      members: "सदस्यहरू",
      events: "कार्यक्रमहरू",
      news: "समाचार",
      committee: "कार्यकारिणी",
      join: "सदस्य बन्नुहोस्",
      contact: "सम्पर्क",
    },
    hero: {
      venue: {
        subtitle: "नेपालका इभेन्ट स्पेसहरूको भविष्य प्रतिनिधित्व गर्दै",
        description:
          "काठमाडौं उपत्यकाभरका ब्यान्क्वेट हल, विवाह स्थल, र इभेन्ट पूर्वाधार प्रदायकहरूलाई एकजुट गर्ने प्रमुख संघ।",
        cta_primary: "सदस्यहरू हेर्नुहोस्",
        stats_members: "सदस्य भेन्युहरू",
        stats_years: "उत्कृष्टताका वर्षहरू",
        stats_events: "वार्षिक कार्यक्रमहरू",
        stats_coverage: "उपत्यका कभरेज",
      },
      person: {
        subtitle: "नेपालको व्यावसायिक समुदायलाई जोड्दै",
        description:
          "काठमाडौं उपत्यकाभरका व्यक्तिगत पेशेवरहरू र उद्योग विशेषज्ञहरूलाई एकजुट गर्ने प्रमुख संघ।",
        cta_primary: "सदस्यहरू हेर्नुहोस्",
        stats_members: "सदस्यहरू",
        stats_years: "उत्कृष्टताका वर्षहरू",
        stats_events: "वार्षिक कार्यक्रमहरू",
        stats_coverage: "उपत्यका कभरेज",
      },
    },
    about: {
      venue: {
        title: "नेपालको इभेन्ट उद्योगलाई अगाडि लैजाँदै",
        description:
          "यो संघ यस क्षेत्रका इभेन्ट भेन्यू र पूर्वाधार प्रदायकहरूको प्रमुख प्रतिनिधि निकाय हो — हाम्रा सदस्यहरूको साझा विकास र उद्योग मापदण्डका लागि एकीकृत आवाज।",
        established: "स्थापना",
        hq: "मुख्य कार्यालय",
        coverage: "क्षेत्र",
      },
      person: {
        title: "नेपालको व्यावसायिक समुदायलाई अगाडि लैजाँदै",
        description:
          "यो संघ यस क्षेत्रका व्यक्तिगत पेशेवरहरू र उद्योग विशेषज्ञहरूको प्रमुख प्रतिनिधि निकाय हो — हाम्रा सदस्यहरूको साझा विकास र मान्यताका लागि एकीकृत आवाज।",
        established: "स्थापना",
        hq: "मुख्य कार्यालय",
        coverage: "क्षेत्र",
      },
    },
    mission: {
      venue: {
        label: "हाम्रो उद्देश्य",
        title: "मिलेर इभेन्ट उद्योग बलियो बनाउँदै",
        items: [
          { title: "उद्योग प्रतिनिधित्व", desc: "हामी उद्योग र सरकारी मञ्चहरूमा भेन्यू सञ्चालकहरू र इभेन्ट व्यवसायहरूको पक्षमा वकालत गर्छौं।" },
          { title: "गुणस्तर मापदण्ड", desc: "हामी सदस्य भेन्युहरूमा सेवा गुणस्तरका मापदण्डहरू स्थापित र कायम गर्छौं।" },
          { title: "उद्योग प्रवर्धन", desc: "हामी नेपालको इभेन्ट उद्योगलाई स्थानीय र अन्तर्राष्ट्रिय रूपमा सक्रिय रूपले प्रवर्धन गर्छौं।" },
          { title: "नेटवर्किङ", desc: "हामी भेन्यू सञ्चालकहरू, आपूर्तिकर्ताहरू, र ग्राहकहरूबीच अर्थपूर्ण सम्बन्धहरू सिर्जना गर्छौं।" },
          { title: "तालिम र विकास", desc: "हामी उद्योग सीपहरू उन्नत गर्न कार्यशालाहरू र तालिम कार्यक्रमहरू आयोजना गर्छौं।" },
          { title: "सामूहिक वृद्धि", desc: "हामी साझा सफलता र विकासको लागि सदस्यहरूबीच सहकार्यलाई प्रोत्साहित गर्छौं।" },
        ],
      },
      person: {
        label: "हाम्रो उद्देश्य",
        title: "मिलेर हाम्रो समुदाय बलियो बनाउँदै",
        items: [
          { title: "व्यावसायिक प्रतिनिधित्व", desc: "हामी उद्योग र सरकारी मञ्चहरूमा हाम्रा सदस्यहरूको हितको पक्षमा वकालत गर्छौं।" },
          { title: "गुणस्तर मापदण्ड", desc: "हामी सदस्यहरूबीच व्यावसायिक मापदण्ड र उत्कृष्ट अभ्यासहरू स्थापित र कायम गर्छौं।" },
          { title: "उद्योग प्रवर्धन", desc: "हामी हाम्रा सदस्यहरूको काम र विशेषज्ञतालाई स्थानीय र अन्तर्राष्ट्रिय रूपमा सक्रिय रूपले प्रवर्धन गर्छौं।" },
          { title: "नेटवर्किङ", desc: "हामी सदस्यहरू, साझेदारहरू, र ग्राहकहरूबीच अर्थपूर्ण सम्बन्धहरू सिर्जना गर्छौं।" },
          { title: "तालिम र विकास", desc: "हामी सदस्यहरूको सीप उन्नत गर्न कार्यशालाहरू र तालिम कार्यक्रमहरू आयोजना गर्छौं।" },
          { title: "सामूहिक वृद्धि", desc: "हामी साझा सफलता र विकासको लागि सदस्यहरूबीच सहकार्यलाई प्रोत्साहित गर्छौं।" },
        ],
      },
    },
    members: {
      venue: {
        label: "सदस्य निर्देशिका",
        title: "हाम्रा सदस्य भेन्युहरू",
        search_placeholder: "नाम वा ठेगानाले भेन्यु खोज्नुहोस्...",
        view_profile: "प्रोफाइल हेर्नुहोस्",
        guests: "अतिथिहरू",
      },
      person: {
        label: "सदस्य निर्देशिका",
        title: "हाम्रा सदस्यहरू",
        search_placeholder: "नाम वा ठेगानाले सदस्य खोज्नुहोस्...",
        view_profile: "प्रोफाइल हेर्नुहोस्",
        guests: "अतिथिहरू",
      },
      filter_all: "सबै क्षेत्र",
      capacity: "क्षमता",
      phone: "फोन",
      website: "वेबसाइट",
    },
    whyjoin: {
      venue: {
        subtitle: "नेपालको प्रमुख इभेन्ट भेन्यू संघमा सामेल हुनुहोस् र आफ्नो व्यवसाय उकास्नुहोस्।",
        benefits: [
          { title: "उद्योग मान्यता", desc: "नेपालको प्रमुख भेन्यू संघको प्रमाणित सदस्यको रूपमा आधिकारिक मान्यता पाउनुहोस्।" },
          { title: "नेटवर्किङ अवसरहरू", desc: "अन्य भेन्यू सञ्चालकहरू, आपूर्तिकर्ताहरू, र इभेन्ट पेशेवरहरूसँग जोडिनुहोस्।" },
          { title: "तालिम कार्यक्रमहरू", desc: "एक्सक्लुसिभ कार्यशालाहरू, सीप विकास, र उद्योग तालिम सत्रहरूमा पहुँच पाउनुहोस्।" },
          { title: "सामूहिक प्रतिनिधित्व", desc: "उद्योग बैठकहरू र सरकारी मञ्चहरूमा आफ्नो हितको प्रतिनिधित्व गराउनुहोस्।" },
          { title: "सदस्य निर्देशिका", desc: "हाम्रो आधिकारिक सदस्य निर्देशिकामा सूचीबद्ध हुनुहोस्, आफ्नो भेन्युको दृश्यता बढाउनुहोस्।" },
          { title: "प्राथमिकता सहयोग", desc: "उद्योग चुनौतीहरू र नियामक मामिलाहरूमा प्राथमिकता सहायता पाउनुहोस्।" },
        ],
      },
      person: {
        subtitle: "नेपालको प्रमुख व्यावसायिक संघमा सामेल हुनुहोस् र आफ्नो करियर उकास्नुहोस्।",
        benefits: [
          { title: "उद्योग मान्यता", desc: "प्रमुख व्यावसायिक संघको प्रमाणित सदस्यको रूपमा आधिकारिक मान्यता पाउनुहोस्।" },
          { title: "नेटवर्किङ अवसरहरू", desc: "अन्य सदस्यहरू, साझेदारहरू, र उद्योग पेशेवरहरूसँग जोडिनुहोस्।" },
          { title: "तालिम कार्यक्रमहरू", desc: "एक्सक्लुसिभ कार्यशालाहरू, सीप विकास, र व्यावसायिक तालिम सत्रहरूमा पहुँच पाउनुहोस्।" },
          { title: "सामूहिक प्रतिनिधित्व", desc: "उद्योग बैठकहरू र सरकारी मञ्चहरूमा आफ्नो हितको प्रतिनिधित्व गराउनुहोस्।" },
          { title: "सदस्य निर्देशिका", desc: "हाम्रो आधिकारिक सदस्य निर्देशिकामा सूचीबद्ध हुनुहोस्, आफ्नो दृश्यता बढाउनुहोस्।" },
          { title: "प्राथमिकता सहयोग", desc: "व्यावसायिक चुनौतीहरू र नियामक मामिलाहरूमा प्राथमिकता सहायता पाउनुहोस्।" },
        ],
      },
    },
    events: {
      label: "कार्यक्रमहरू र गतिविधिहरू",
      title: "हाम्रो काम",
      subtitle: "अर्थपूर्ण कार्यक्रमहरू मार्फत हाम्रो समुदायलाई एकसाथ ल्याउँदै",
      upcoming: "आगामी",
      past: "विगतका कार्यक्रमहरू",
      view_all: "सबै कार्यक्रमहरू हेर्नुहोस्",
    },
    news: {
      label: "समाचार र घोषणाहरू",
      title: "ताजा समाचार",
      subtitle: "उद्योग समाचार, घोषणाहरू, र संघ अपडेटहरूसँग अद्यावधिक रहनुहोस्",
      read_more: "थप पढ्नुहोस्",
      view_all: "सबै समाचार हेर्नुहोस्",
    },
    committee: {
      label: "कार्यकारिणी समिति",
      title: "हाम्रो नेतृत्व",
      subtitle: "हाम्रो समुदायलाई मार्गदर्शन गर्ने अनुभवी नेताहरू",
      president: "अध्यक्ष",
      immediate_past_president: "नि. अध्यक्ष",
      senior_vice_president: "वरिष्ठ उपाध्यक्ष",
      vice_president: "उपाध्यक्ष",
      general_secretary: "महासचिव",
      secretary: "सचिव",
      treasurer: "कोषाध्यक्ष",
      member: "समिति सदस्य",
    },
    join: {
      label: "सदस्यता आवेदन",
      title: "सदस्य बन्नुहोस्",
      subtitle: "हाम्रो संघमा सामेल हुनुहोस् र आधिकारिक सदस्य समुदायको हिस्सा बन्नुहोस्",
      venue_name: "भेन्युको नाम",
      owner_name: "सञ्चालक / व्यवस्थापकको नाम",
      phone: "फोन नम्बर",
      email: "इमेल ठेगाना",
      location: "ठेगाना",
      capacity: "भेन्यु क्षमता",
      website: "वेबसाइट (वैकल्पिक)",
      submit: "आवेदन पेश गर्नुहोस्",
      success: "आवेदन सफलतापूर्वक पेश भयो! हामी चाँडै तपाईंलाई सम्पर्क गर्नेछौं।",
      required: "अनिवार्य",
    },
    contact: {
      label: "सम्पर्क गर्नुहोस्",
      title: "हामीलाई सम्पर्क गर्नुहोस्",
      address: "काठमाडौं, नेपाल",
      phone: "+977-1-XXXXXXX",
      email: "info@example.org",
      follow: "हामीलाई फलो गर्नुहोस्",
    },
    footer: {
      venue: { tagline: "नेपालका इभेन्ट स्पेसहरूको भविष्य प्रतिनिधित्व गर्दै" },
      person: { tagline: "नेपालको व्यावसायिक समुदायलाई जोड्दै" },
      quick_links: "द्रुत लिंकहरू",
      contact_info: "सम्पर्क जानकारी",
      follow_us: "हामीलाई फलो गर्नुहोस्",
      rights: "सर्वाधिकार सुरक्षित।",
    },
  },
} as const;

// Flattens the venue/person variant into the shape components already consume
// (t.hero.subtitle, t.mission.items, etc.) so no consuming component needs to know
// about member_mode itself for TEXT content — only components that also need to swap
// images or hide/show whole sections (Hero, MemberDirectory, WhyJoin, About) take an
// explicit memberMode prop in addition to reading this resolved `t`.
export function resolveTranslations(locale: Locale, memberMode: MemberMode = "venue") {
  const raw = translations[locale];
  const mode = memberMode === "person" ? "person" : "venue";
  return {
    ...raw,
    hero: raw.hero[mode],
    about: raw.about[mode],
    mission: raw.mission[mode],
    members: { ...raw.members[mode], filter_all: raw.members.filter_all, capacity: raw.members.capacity, phone: raw.members.phone, website: raw.members.website },
    whyjoin: raw.whyjoin[mode],
    footer: { ...raw.footer, ...raw.footer[mode] },
  };
}

export type TranslationKeys = ReturnType<typeof resolveTranslations>;
