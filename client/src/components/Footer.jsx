
import { Link } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import "./Footer.css";

const discoverLinks = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/#movies" },
  { label: "Theatres", href: "/theatres" },
  { label: "About Us", href: "/about-us" },
];

const supportLinks = [
  { label: "Help Centre", href: "/help" },
  { label: "Contact Us", href: "/contact" },
  { label: "Frequently Asked Questions", href: "/faq" },
];

const policyLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cancellation & Refunds", href: "/cancellation-policy" },
];

function FooterLinks({ title, links }) {
  return (
    <div className="footer-column">
      <h3>{title}</h3>

      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.href}>
              {link.label}
              <span className="footer-link-arrow">↗</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        {/* Brand */}
        <div className="footer-brand-section">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">
              <Clapperboard size={25} />
            </span>

            <span>
              Cine<span className="footer-gold">Lockz</span>
            </span>
          </Link>

          <p className="footer-description">
            Every seat. Every story. Every moment matters.
            Discover movies, explore theatres and make
            your next cinema experience unforgettable.
          </p>

          <div className="footer-brand-points">
            <div>
              <span className="footer-point-icon">✓</span>
              <span>Easy movie booking</span>
            </div>

            <div>
              <span className="footer-point-icon">✓</span>
              <span>Smart ticket protection</span>
            </div>
          </div>

          <div className="footer-socials">
            <span>FOLLOW CINELOCKZ</span>

            <div className="footer-social-icons">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                IG
              </a>

              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                YT
              </a>

              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                FB
              </a>
            </div>
          </div>
        </div>

        {/* Discover */}
        <FooterLinks
          title="Discover"
          links={discoverLinks}
        />

        {/* Support */}
        <div className="footer-column">
          <h3>Customer Support</h3>

          <ul>
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href}>
                  {link.label}
                  <span className="footer-link-arrow">↗</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="footer-contact-note">
            Need assistance? We're here to help with your
            cinema experience.
          </p>
        </div>

        {/* Policies */}
        <FooterLinks
          title="Our Policies"
          links={policyLinks}
        />
      </div>

      {/* Information strip */}
      <div className="footer-info-strip">
        <span>✦ Made for movie lovers in India</span>
        <span className="footer-info-divider" />
        <span>More than movies. Memories.</span>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>
          © {currentYear} CineLockz. All rights reserved.
        </p>

        <div>
          <Link to="/">Home</Link>
          <span>•</span>
          <Link to="/#movies">Explore Movies</Link>
          <span>•</span>
          <Link to="/about-us">About CineLockz</Link>
        </div>

        <button
          className="footer-back-top"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
