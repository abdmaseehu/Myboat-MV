import { Inter, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata = {
  title: "Myboat MV — Maldives Ferry & Speedboat Booking",
  description:
    "Book ferries, private speedboat charters, and logistics services across the 1,192 islands of the Maldives. Verified operators, tiered pricing, and instant confirmation.",
  keywords:
    "maldives ferry, speedboat booking, private charter maldives, sea travel maldives, myboat, atoll transfer, seaplane alternative",
  openGraph: {
    title: "Myboat MV — Sail the Maldives, effortlessly",
    description:
      "The premium marketplace for Maldives sea transport: scheduled ferries, private charters, and logistics.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
