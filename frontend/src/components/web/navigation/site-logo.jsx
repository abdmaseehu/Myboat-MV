"use client";

import Link from "next/link";
import { useSettings } from "@/hooks/use-settings";

export function SiteLogo({ variant = "auto" }) {
  const { value: siteName } = useSettings("SITE_NAME");
  const { value: siteLogo } = useSettings("SITE_LOGO");

  // variant: "auto" (uses current theme classes), "light" (for dark bg), "dark" (for light bg)
  const isLight = variant === "light";

  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 select-none"
      aria-label="Myboat MV — home"
    >
      {/* Icon — stylized wave/anchor mark in a soft rounded tile */}
      <span
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105 ${
          isLight
            ? "bg-white/12 ring-1 ring-white/20 backdrop-blur"
            : "bg-lagoon/10 ring-1 ring-lagoon/20"
        }`}
      >
        {siteLogo ? (
          <img
            src={`${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${siteLogo}`}
            alt=""
            className="h-6 w-6 object-contain"
          />
        ) : (
          <svg
            viewBox="0 0 32 32"
            className={`h-6 w-6 ${isLight ? "text-white" : "text-lagoon"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Anchor + waves */}
            <circle cx="16" cy="8" r="2.4" />
            <path d="M16 10.4v13.2" />
            <path d="M10 15h12" />
            <path d="M8 20c1.6 3.2 4.8 5 8 5s6.4-1.8 8-5" />
            <path d="M4 27.5c1.8 1.2 3.2 1.2 5 0s3.2-1.2 5 0 3.2 1.2 5 0 3.2-1.2 5 0 3.2 1.2 4 .5" />
          </svg>
        )}
      </span>

      {/* Wordmark */}
      <span className="flex items-baseline leading-none">
        <span
          className={`font-serif italic text-[22px] md:text-[24px] tracking-tight ${
            isLight ? "text-white" : "text-ocean-deep"
          }`}
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          {siteName || "Myboat"}
        </span>
        <span
          className={`ml-1.5 font-serif italic text-[14px] md:text-[15px] tracking-wide ${
            isLight ? "text-lagoon-light" : "text-lagoon"
          }`}
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          MV
        </span>
      </span>
    </Link>
  );
}
