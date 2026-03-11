import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import StatsSection from "@/components/sections/StatsSection";
import About from "@/components/sections/About";
import Mission from "@/components/sections/Mission";
import MemberDirectory from "@/components/sections/MemberDirectory";
import WhyJoin from "@/components/sections/WhyJoin";
import Events from "@/components/sections/Events";
import News from "@/components/sections/News";
import ExecutiveCommittee from "@/components/sections/ExecutiveCommittee";
import MembershipForm from "@/components/sections/MembershipForm";
import Contact from "@/components/sections/Contact";
import Timeline from "@/components/sections/Timeline";

export const metadata: Metadata = {
  title:
    "EVA Nepal – Event and Venue Association Nepal | Representing Nepal's Event Industry",
  description:
    "EVA Nepal is the official association of event venues, banquet halls and wedding venues in Kathmandu. Representing 150+ member venues across Kathmandu Valley since 2011.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <StatsSection />
      <About />
      <Mission />
      <MemberDirectory />
      <WhyJoin />
      <Timeline />
      <Events />
      <News />
      <ExecutiveCommittee />
      <MembershipForm />
      <Contact />
    </>
  );
}
