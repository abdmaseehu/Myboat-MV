"use client";

import { Ship } from "lucide-react";

export const LoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative w-48 h-24">
        {/* Water */}
        <div className="absolute bottom-2 w-full h-2">
          <div className="h-full bg-sky-200 dark:bg-sky-900/30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 w-full flex justify-around">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-6 h-0.5 bg-sky-500/50 dark:bg-sky-500/30 rounded animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Ship icon bobbing */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-2 text-sky-500"
          style={{ animation: "shipBob 1.6s ease-in-out infinite" }}
        >
          <Ship className="h-12 w-12" />
        </div>

        <style jsx>{`
          @keyframes shipBob {
            0%, 100% { transform: translate(-50%, 0) rotate(-2deg); }
            50% { transform: translate(-50%, -6px) rotate(2deg); }
          }
        `}</style>
      </div>

      {/* Loading text */}
      <div className="mt-6 relative">
        <p className="text-base font-medium bg-gradient-to-r from-sky-500 via-sky-600 to-sky-500 dark:from-sky-400 dark:via-sky-500 dark:to-sky-400 bg-clip-text text-transparent animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
};
