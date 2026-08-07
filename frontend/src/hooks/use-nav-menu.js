"use client";

import { useEffect, useState } from "react";

/**
 * The public site's header links, from Admin → Content → Menus.
 *
 * The built-in list is the fallback, not the source: if the API is slow or
 * unreachable the header still renders something navigable rather than
 * collapsing to nothing. It is also what the first paint shows, so the nav
 * does not appear empty and then pop in.
 *
 * Desktop and mobile used to keep separate hard-coded arrays which had already
 * drifted apart — mobile had Services and called charter "Private Charter".
 * Both read this now, so the menu is one thing in one place.
 */
const FALLBACK = [
  { id: "f-home", label: "Home", url: "/", openInNewTab: false },
  { id: "f-ferry", label: "Ferry", url: "/ferry", openInNewTab: false },
  { id: "f-charter", label: "Charter", url: "/charter", openInNewTab: false },
  { id: "f-logistics", label: "Logistics", url: "/logistics", openInNewTab: false },
  { id: "f-about", label: "About", url: "/about", openInNewTab: false },
  { id: "f-contact", label: "Contact", url: "/contact", openInNewTab: false },
];

export function useNavMenu(location = "HEADER") {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/nav?location=${location}`
        );
        if (!res.ok) return;
        const json = await res.json();
        const list = json?.data;
        // An empty menu is a configuration an administrator can choose, but it
        // is far more often a failed request — keep the fallback either way.
        if (!cancelled && Array.isArray(list) && list.length > 0) setItems(list);
      } catch {
        // Keep the fallback; a header is not worth an error message.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location]);

  return items;
}

export { FALLBACK as FALLBACK_NAV };
