// Minimal layout for embeddable iframe pages — no nav, no header, no footer.
// The root app/layout.js already provides <html>, <body>, and ThemeProvider.

export const metadata = {
  title: "MyBoat Embed",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }) {
  return <div className="bg-transparent text-foreground">{children}</div>;
}
