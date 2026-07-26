"use client";

import Link from "next/link";
import { useSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteLogo() {
  const { value: siteName, isLoading: isLoadingSiteName } =
    useSettings("SITE_NAME");
  const { value: siteLogo, isLoading: isLoadingLogo } =
    useSettings("SITE_LOGO");

  return (
    <Link href="/" className="flex items-center space-x-2">
      {isLoadingLogo ? (
        <Skeleton className="h-8 w-8 rounded-lg" />
      ) : siteLogo ? (
        <div className="h-8 w-8 relative">
          <img
            src={`${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${siteLogo}`}
            alt="Site Logo"
            className="h-full w-full object-contain rounded-lg"
          />
        </div>
      ) : null}
      {isLoadingSiteName ? (
        <Skeleton className="h-6 w-32" />
      ) : (
        <span className="text-2xl font-bold text-sky-500">
          {siteName || "Myboat MV"}
        </span>
      )}
    </Link>
  );
}
