import { getAssociation } from "@/lib/getAssociation";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const association = await getAssociation();
  const logo = association?.logo ?? "/eva/evanepal_transparent.png";
  return (
    <Navbar
      logo={logo}
      name={association?.name ?? "EVA Nepal"}
      logoInvert={false}
    />
  );
}
