import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Anchor } from "lucide-react";

const explore = [
  { href: "/", label: "Home" },
  { href: "/bus-tickets", label: "Ferry Tickets" },
  { href: "/charter", label: "Private Charter" },
  { href: "/logistics", label: "Logistics" },
];
const content = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
  { href: "/", label: "Blog" },
];
const support = [
  { href: "/contact", label: "Help Center" },
  { href: "/", label: "Privacy Policy" },
  { href: "/", label: "Terms of Service" },
  { href: "/", label: "Cookie Preferences" },
];

export function Footer() {
  return (
    <footer className="relative bg-ocean-deep text-white/85 overflow-hidden">
      {/* Wave divider top */}
      <svg
        className="absolute top-0 left-0 right-0 w-full h-10 md:h-16 -translate-y-[1px] text-ocean-deep fill-current"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,32 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z" />
      </svg>

      {/* Subtle glow */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-lagoon/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-coral/15 blur-3xl" />

      <div className="container-x pt-20 md:pt-28 pb-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-5 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="h-11 w-11 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center backdrop-blur">
                <Anchor className="h-5 w-5 text-lagoon-light" />
              </span>
              <span className="flex items-baseline leading-none">
                <span
                  className="text-2xl italic text-white"
                  style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                >
                  Myboat
                </span>
                <span
                  className="ml-1.5 text-[15px] italic text-lagoon-light"
                  style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                >
                  MV
                </span>
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed max-w-md">
              The premium marketplace for Maldives sea transport. Ferries, private charters, and cargo — connecting 1,192 islands with verified operators.
            </p>

            {/* Contact card */}
            <div className="glass-dark rounded-2xl p-5 space-y-3 max-w-md">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-lagoon-light mt-0.5 shrink-0" />
                <span>Boduthakurufaanu Magu, Malé City, Maldives</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-lagoon-light shrink-0" />
                <a href="mailto:info@myboat.mv" className="hover:text-white transition-colors">
                  info@myboat.mv
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-lagoon-light shrink-0" />
                <a href="tel:+9600000000" className="hover:text-white transition-colors">
                  +960 000-0000
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SocialLink href="#" icon={Instagram} label="Instagram" />
              <SocialLink href="#" icon={Facebook} label="Facebook" />
              <SocialLink href="#" icon={Twitter} label="Twitter" />
            </div>
          </div>

          <FooterCol title="Explore" links={explore} className="md:col-span-2" />
          <FooterCol title="Content" links={content} className="md:col-span-2" />
          <FooterCol title="Support" links={support} className="md:col-span-3" />
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-white/50 tracking-wide">
            &copy; {new Date().getFullYear()} Myboat MV. Maldives sea transport marketplace.
          </p>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <select
              className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-lagoon/50"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="dv">ދިވެހި</option>
            </select>
            <select
              className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-lagoon/50"
              defaultValue="mvr"
            >
              <option value="mvr">MVR</option>
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-white text-sm font-medium uppercase tracking-[0.2em]">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-white/65 hover:text-lagoon-light transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-white/8 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 hover:border-lagoon-light/50 transition-all"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
