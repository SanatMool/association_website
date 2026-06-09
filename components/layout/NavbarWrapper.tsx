import { getAssociation } from "@/lib/getAssociation";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const association = await getAssociation();
  const logo = association?.logo ?? "/eva/evanepal_transparent.png";
  // Use brightness-0 invert only for transparent-background logos (they show as white silhouette on dark navbar)
  const logoInvert = logo.includes("_transparent");
  return (
    <Navbar
      logo={logo}
      name={association?.name ?? "EVA Nepal"}
      logoInvert={logoInvert}
    />
  );
}
