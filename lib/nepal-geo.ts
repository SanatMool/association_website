// Nepal provinces and districts — used for address dropdowns across forms

export const NEPAL_PROVINCES = [
  "Koshi Province / कोशी प्रदेश",
  "Madhesh Province / मधेश प्रदेश",
  "Bagmati Province / बागमती प्रदेश",
  "Gandaki Province / गण्डकी प्रदेश",
  "Lumbini Province / लुम्बिनी प्रदेश",
  "Karnali Province / कर्णाली प्रदेश",
  "Sudurpashchim Province / सुदूरपश्चिम प्रदेश",
];

// 77 districts grouped by province (for reference), exported as a flat sorted list
export const NEPAL_DISTRICTS: Record<string, string[]> = {
  "Koshi Province / कोशी प्रदेश": [
    "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang",
    "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Sindhuli",
    "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur",
  ],
  "Madhesh Province / मधेश प्रदेश": [
    "Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat",
    "Saptari", "Sarlahi", "Siraha",
  ],
  "Bagmati Province / बागमती प्रदेश": [
    "Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu",
    "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot",
    "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok",
  ],
  "Gandaki Province / गण्डकी प्रदेश": [
    "Baglung", "Gorkha", "Kaski", "Lamjung", "Manang",
    "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahu",
  ],
  "Lumbini Province / लुम्बिनी प्रदेश": [
    "Arghakhanchi", "Banke", "Bardiya", "Dang", "Eastern Rukum",
    "Gulmi", "Kapilvastu", "Nawalparasi (West)", "Palpa",
    "Pyuthan", "Rolpa", "Rupandehi",
  ],
  "Karnali Province / कर्णाली प्रदेश": [
    "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla",
    "Kalikot", "Mugu", "Salyan", "Surkhet", "Western Rukum",
  ],
  "Sudurpashchim Province / सुदूरपश्चिम प्रदेश": [
    "Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura",
    "Darchula", "Doti", "Kailali", "Kanchanpur",
  ],
};

// All districts sorted alphabetically — use when province is not yet selected
export const ALL_DISTRICTS = Object.values(NEPAL_DISTRICTS).flat().sort();

// Districts filtered by province
export function getDistrictsByProvince(province: string): string[] {
  return NEPAL_DISTRICTS[province] ?? ALL_DISTRICTS;
}
