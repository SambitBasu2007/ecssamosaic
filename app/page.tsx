import About from "@/components/About/About";
import EventDetails from "@/components/EventDetails/EventDetails";
import Footer from "@/components/Footer/Footer";
import Hero from "@/components/Hero/Hero";
import OurTheme from "@/components/OurTheme/OurTheme";
import Register from "@/components/Register/Register";

/**
 * The single page.
 *
 * Every section is a self-contained component with a sibling CSS file; this file
 * just stacks them in story order.
 */
export default function HomePage() {
  return (
    <>
      <main id="content">
        <Hero />
        <About />
        <OurTheme />
        <EventDetails />
        <Register />
      </main>
      <Footer />
    </>
  );
}
