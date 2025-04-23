import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <Header className="fixed top-0 right-0 left-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border" />
      <div className="flex-1 pt-16 sm:pt-20 w-full">{children}</div>
      {/* <Footer /> */}
    </div>
  );
}
