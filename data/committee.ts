export interface CommitteeMember {
  id: number;
  name: string;
  role: string;
  roleKey: string;
  venue?: string;
  bio: string;
  order: number;
}

export const committee: CommitteeMember[] = [
  {
    id: 1,
    name: "Uttam Prakash Sharma",
    role: "President",
    roleKey: "president",
    venue: "Viva Event and Convention",
    bio: "Mr. Uttam Prakash Sharma has been a driving force behind EVA Nepal's growth and has championed the interests of event venues across Kathmandu for over a decade.",
    order: 1,
  },
  {
    id: 2,
    name: "Shiva Bhakta Ranjit",
    role: "Vice President",
    roleKey: "vice_president",
    venue: "Paradise Banquet",
    bio: "Mr. Shiva Bhakta Ranjit brings extensive industry experience and has been instrumental in developing quality standards for member venues.",
    order: 2,
  },
  {
    id: 3,
    name: "Ramesh Kumar Shrestha",
    role: "Secretary",
    roleKey: "secretary",
    venue: "Himalayan Convention Center",
    bio: "Mr. Ramesh Kumar Shrestha oversees the association's administrative functions and coordinates all member activities and communications.",
    order: 3,
  },
  {
    id: 4,
    name: "Binod Prasad Acharya",
    role: "Treasurer",
    roleKey: "treasurer",
    venue: "Everest Banquet",
    bio: "Mr. Binod Prasad Acharya manages the association's financial affairs with transparency and professionalism.",
    order: 4,
  },
  {
    id: 5,
    name: "Sanjay Maharjan",
    role: "Committee Member",
    roleKey: "member",
    venue: "Heritage Event Center",
    bio: "Mr. Sanjay Maharjan represents the interests of event venues in Patan and the southern valley.",
    order: 5,
  },
  {
    id: 6,
    name: "Deepika Thapa",
    role: "Committee Member",
    roleKey: "member",
    venue: "Sapphire Banquet",
    bio: "Ms. Deepika Thapa leads the training and development initiatives for EVA Nepal members.",
    order: 6,
  },
  {
    id: 7,
    name: "Narayan Prasad Poudel",
    role: "Committee Member",
    roleKey: "member",
    venue: "Diamond Hall",
    bio: "Mr. Narayan Prasad Poudel coordinates networking events and industry partnerships.",
    order: 7,
  },
  {
    id: 8,
    name: "Sunita Gurung",
    role: "Committee Member",
    roleKey: "member",
    venue: "Golden Gate Banquet",
    bio: "Ms. Sunita Gurung heads the membership drive and handles new member onboarding.",
    order: 8,
  },
  {
    id: 9,
    name: "Prakash Lama",
    role: "Committee Member",
    roleKey: "member",
    venue: "Royal Palace Banquet",
    bio: "Mr. Prakash Lama oversees the association's digital presence and member directory.",
    order: 9,
  },
];
