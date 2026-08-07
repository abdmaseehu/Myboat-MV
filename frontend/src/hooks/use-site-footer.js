"use client";

import { useEffect, useState } from "react";

/**
 * The custom footer, if one is live.
 *
 * Returns `{ active, html }`. `active` is false until the API says otherwise,
 * so the built-in footer renders first and is only replaced once there is
 * something to replace it with — the bottom of the page never flashes empty,
 * and an unreachable API leaves the site looking exactly as it always did.
 */
export function useSiteFooter() {
  const [footer, setFooter] = useState({ active: false, html: "" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/footer`);
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!cancelled && d?.active && d?.html) {
          setFooter({ active: true, html: d.html });
        }
      } catch {
        // Keep the built-in footer; this is not worth an error message.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return footer;
}
