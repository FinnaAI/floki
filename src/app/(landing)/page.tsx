import { Hero } from "@/components/landing/Hero";
import * as motion from "motion/react-client";
import { ClientTweetCard } from "@/components/landing/tweet-client";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full">
      <main className="w-full h-full">
        {/* Hero Section */}
        <Hero />
      </main>
    </div>
  );
}
