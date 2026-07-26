import Link from "next/link";

const footerLinks = {
  quickLinks: [
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
  services: [
    { href: "/bus-tickets", label: "Ferry Tickets" },
    { href: "/routes", label: "Routes" },
    { href: "/packages", label: "Travel Packages" },
    { href: "/offers", label: "Special Offers" },
  ],
  contact: [
    { label: "Email: info@myboat.mv" },
    { label: "Phone: +960 000-0000" },
    { label: "Address: Malé City" },
    { label: "Maldives" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Myboat MV</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted partner for safe and comfortable sea travel across
              the Maldives.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-sky-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-sky-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.contact.map((item, index) => (
                <li key={index}>{item.label}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Myboat MV. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
