
import {
  Clapperboard,
  ShieldCheck,
  Ticket,
  MonitorPlay,
  Heart,
  Target,
  Sparkles,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./AboutUs.css";

const features = [
  {
    icon: Ticket,
    title: "Seamless Movie Booking",
    description:
      "Discover movies, explore showtimes and select your favourite seats through a simple booking experience.",
  },
  {
    icon: MonitorPlay,
    title: "Premium Cinema Experience",
    description:
      "Experience cinema through advanced screen technologies and thoughtfully designed theatre experiences.",
  },
  {
    icon: ShieldCheck,
    title: "Smart Ticket Protection",
    description:
      "Our platform is designed with smart anti-piracy concepts to support more secure and protected cinema experiences.",
  },
];

export default function AboutUs() {
  return (
    <div className="app-shell about-page">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="about-hero">
          <div className="about-hero-content">
            <span className="about-eyebrow">
              THE STORY BEHIND CINELOCKZ
            </span>

            <h1>
              Every Seat.
              <br />
              Every Story.
              <br />
              <span>Every Moment Matters.</span>
            </h1>

            <p>
              We're building a smarter way to discover movies,
              book cinema experiences and enjoy the magic
              of the big screen.
            </p>

            <a href="#our-story" className="about-hero-button">
              Discover Our Story
              <Sparkles size={17} />
            </a>
          </div>

          <div className="about-hero-art">
            <div className="about-art-circle">
              <Clapperboard size={76} strokeWidth={1.2} />
            </div>

            <span className="about-art-caption">
              MORE THAN JUST MOVIES
            </span>
          </div>
        </section>

        {/* Our Story */}
        <section className="about-story" id="our-story">
          <div className="about-section-label">
            <span />
            OUR STORY
          </div>

          <div className="about-story-grid">
            <div>
              <h2>
                Redefining the way
                <br />
                you experience <span>cinema.</span>
              </h2>
            </div>

            <div className="about-story-description">
              <p>
                CineLockz is a cinema booking and smart
                anti-piracy platform built around one simple
                idea: making every movie experience more
                convenient, engaging and secure.
              </p>

              <p>
                From discovering movies and choosing seats
                to completing bookings, we aim to bring the
                cinema journey together in one place.
              </p>

              <p>
                We believe watching a movie should be about
                enjoying the story, the atmosphere and the
                experience — without unnecessary complexity.
              </p>
            </div>
          </div>
        </section>

        {/* Mission and Vision */}
        <section className="about-purpose">
          <article className="about-purpose-card">
            <div className="about-purpose-icon">
              <Target size={25} />
            </div>

            <span>OUR MISSION</span>

            <h3>Make cinema accessible and seamless.</h3>

            <p>
              To simplify movie discovery and ticket booking
              while creating a better-connected cinema
              experience for movie lovers.
            </p>
          </article>

          <article className="about-purpose-card">
            <div className="about-purpose-icon">
              <Heart size={25} />
            </div>

            <span>OUR VISION</span>

            <h3>Protect the magic of cinema.</h3>

            <p>
              To build a smarter cinema ecosystem that
              combines convenient technology, engaging
              experiences and innovative ticket protection.
            </p>
          </article>
        </section>

        {/* What We Offer */}
        <section className="about-features">
          <div className="about-features-heading">
            <div className="about-section-label">
              <span />
              WHAT MAKES US DIFFERENT
            </div>

            <h2>
              A better way to
              <span> experience movies.</span>
            </h2>

            <p>
              Everything we build is focused on improving
              the journey from discovering a movie to
              experiencing it on the big screen.
            </p>
          </div>

          <div className="about-features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  className="about-feature-card"
                  key={feature.title}
                >
                  <div className="about-feature-icon">
                    <Icon size={26} />
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Closing Banner */}
        <section className="about-closing">
          <span>WELCOME TO CINELOCKZ</span>

          <h2>
            Your next favourite
            <br />
            <span>movie moment starts here.</span>
          </h2>

          <a href="/" className="about-hero-button">
            Explore Movies
            <Clapperboard size={17} />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
