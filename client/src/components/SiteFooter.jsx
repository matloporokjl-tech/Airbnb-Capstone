
import { Link } from "react-router";

const footerGroups = [
  {
    title: "Support",
    links: [
      "Help Centre",
      "Get help with a safety issue",
      "AirCover",
      "Anti-discrimination",
      "Accessibility support",
    ],
  },
  {
    title: "Hosting",
    links: [
      "Airbnb your home",
      "AirCover for Hosts",
      "Hosting resources",
      "Community forum",
      "Hosting responsibly",
    ],
  },
  {
    title: "Airbnb",
    links: [
      "Newsroom",
      "New features",
      "Careers",
      "Investors",
      "Gift cards",
    ],
  },
  {
    title: "Community",
    links: [
      "Airbnb.org",
      "Diversity and belonging",
      "Against discrimination",
      "Community support",
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-main">
        {footerGroups.map((group) => (
          <div className="footer-column" key={group.title}>
            <h3>{group.title}</h3>

            {group.links.map((link) => (
              <a href="#footer" key={link}>
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="copyright">
          <span>© 2026 Airbnb Capstone.</span>
          <Link to="/">Privacy</Link>
          <Link to="/">Terms</Link>
          <Link to="/">Sitemap</Link>
        </div>

        <div className="footer-preferences">
          <label>
            <span className="sr-only">Language</span>
            <select defaultValue="English">
              <option>English</option>
              <option>isiZulu</option>
              <option>Afrikaans</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Currency</span>
            <select defaultValue="ZAR">
              <option value="ZAR">ZAR R</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
            </select>
          </label>

          <a href="#footer" aria-label="Facebook">f</a>
          <a href="#footer" aria-label="Instagram">◎</a>
          <a href="#footer" aria-label="X">𝕏</a>
        </div>
      </div>
    </footer>
  );
}
