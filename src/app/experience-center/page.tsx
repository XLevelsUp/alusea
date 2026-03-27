import type { Metadata } from "next";
import ExperienceCenterClient from "./ExperienceCenterClient";

export const metadata: Metadata = {
  title: "Experience Center",
  description:
    "Take an interactive virtual tour of the Alusea Experience Center. Discover our premium aluminium structural systems, sliding doors, and custom hardware.",
  alternates: {
    canonical: "https://alusea.in/experience-center",
  },
};

export default function ExperienceCenterPage() {
  return <ExperienceCenterClient />;
}
