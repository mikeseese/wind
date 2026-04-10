import Navbar from "@/components/Navbar";
import ForecastSection from "@/components/ForecastSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <ForecastSection />
      </main>
      <Footer />
    </>
  );
}
