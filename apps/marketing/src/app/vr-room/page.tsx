import type { Metadata } from "next";
import VrRoom from "./VrRoom";

export const metadata: Metadata = {
  title: "Virtual Showroom",
  description: "Walk through the Alusea Experience Centre in 360°: look around every room and tap the products to learn more.",
  alternates: {
    canonical: "/vr-room",
  },
};

export default function VrRoomPage() {
  // Drawn on the server too, so the site's header, footer and floating buttons are hidden from the first paint.
  return (
    <div data-vr-room className="fixed inset-0 z-[100] bg-blueberry">
      <VrRoom />
    </div>
  );
}
