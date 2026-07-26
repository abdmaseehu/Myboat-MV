"use client";

export const LoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative w-48">
        {/* Background Scene */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/30 to-transparent dark:from-sky-900/10 h-24 -mt-6 rounded-xl"></div>

        {/* Road */}
        <div className="absolute bottom-2 w-full h-2">
          <div className="h-full bg-sky-200 dark:bg-sky-900/30 rounded-full animate-pulse"></div>
          {/* Road markings */}
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

        {/* Bus */}
        <div className="relative animate-drive transform-gpu">
          <div className="w-24 h-12 bg-gradient-to-b from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600 rounded-lg relative shadow-xl">
            {/* Bus body details */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-300 dark:bg-sky-400/50"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-sky-600/20 dark:bg-black/20"></div>
            </div>

            {/* Windows */}
            <div className="absolute top-1.5 left-12 right-1.5 h-4 bg-sky-200/90 dark:bg-sky-400/20 rounded-lg grid grid-cols-3 gap-0.5 p-0.5 backdrop-blur-sm">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-sky-100 dark:bg-sky-300/10 rounded shadow-inner"
                  style={{
                    animation: `windowGlow 1s ease-in-out ${i * 0.3}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            {/* Front window */}
            <div className="absolute top-1.5 left-1.5 w-8 h-4 bg-sky-200/90 dark:bg-sky-400/20 rounded-lg backdrop-blur-sm">
              <div className="absolute inset-0.5 bg-sky-100/50 dark:bg-sky-300/10 rounded"></div>
            </div>

            {/* Wheels with enhanced detail */}
            {[{ left: "3" }, { right: "3" }].map((pos, i) => (
              <div
                key={i}
                className={`absolute -bottom-1.5 ${
                  pos.left ? `left-${pos.left}` : `right-${pos.right}`
                } w-4 h-4`}
              >
                <div className="absolute inset-0 bg-zinc-800 dark:bg-zinc-700 rounded-full animate-spin">
                  <div className="absolute inset-0.5 bg-zinc-700 dark:bg-zinc-600 rounded-full"></div>
                  <div className="absolute inset-1 bg-zinc-600 dark:bg-zinc-500 rounded-full border-2 border-zinc-700 dark:border-zinc-600"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Smoke animation */}
        <div className="absolute -left-3 bottom-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative"
              style={{
                top: `${i * -6}px`,
                left: `${i * 1}px`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <div
                className={`
                absolute w-2 h-2
                bg-gradient-to-t from-zinc-300 to-zinc-200
                dark:from-zinc-600 dark:to-zinc-500
                rounded-full
                animate-smoke-${i + 1}
                opacity-0
                blur-sm
              `}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading text with gradient */}
      <div className="mt-6 relative">
        <p className="text-base font-medium bg-gradient-to-r from-sky-500 via-sky-600 to-sky-500 dark:from-sky-400 dark:via-sky-500 dark:to-sky-400 bg-clip-text text-transparent animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
};
