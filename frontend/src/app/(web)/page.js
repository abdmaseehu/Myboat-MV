import Hero from "@/components/web/hero";
import HomeSearchCard from "@/components/web/home-search-card";
import Features from "@/components/web/features";
import SummerTrips from "@/components/web/summer-trips";
import Steps from "@/components/web/steps";
import Testimonials from "@/components/web/testimonials";
import Blog from "@/components/web/blog";

export const metadata = {
  title: "Myboat MV — Sail the Maldives, effortlessly",
  description:
    "Ferries, private charters, and cargo across the 1,192 islands of the Maldives. Verified operators, tiered pricing, and instant confirmations.",
  keywords:
    "maldives ferry, speedboat booking, private charter maldives, myboat, sea travel maldives",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeSearchCard />
      <Features />
      <SummerTrips />
      <Steps />
      <Testimonials />
      <Blog />
    </>
  );
}
