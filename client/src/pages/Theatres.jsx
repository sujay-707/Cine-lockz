
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TheatresSection from "../components/TheatresSection";

import "./Theatres.css";

export default function Theatres() {
  return (
    <div className="app-shell theatres-page">
      <Navbar />

      <main>
        <div className="theatres-page-banner">
          <span>THE CINELOCKZ EXPERIENCE</span>
          <h1>Our Theatres</h1>
          <p>
            Discover premium cinema experiences,
            advanced screen technologies and
            exceptional comfort.
          </p>
        </div>

        <TheatresSection />
      </main>

      <Footer />
    </div>
  );
}
