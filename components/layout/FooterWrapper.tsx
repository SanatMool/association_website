import { getSettings } from "@/lib/settings";
import Footer from "./Footer";

export default async function FooterWrapper() {
  const s = await getSettings();
  return (
    <Footer
      settings={{
        tagline:   s.footer_tagline,
        phone:     s.contact_phone,
        email:     s.contact_email,
        address:   s.contact_address,
        facebook:  s.social_facebook,
        instagram: s.social_instagram,
        youtube:   s.social_youtube,
      }}
    />
  );
}
