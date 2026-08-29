import { getAssociation } from "@/lib/getAssociation";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const association = await getAssociation();
  const logo = association?.logo ?? "/default-logo.png";
  return (
    <Navbar
      logo={logo}
      name={association?.name ?? "Member Association"}
      logoInvert={false}
    />
  );
}
