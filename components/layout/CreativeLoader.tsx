"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LoadingContext = createContext<{
  setLoading: (loading: boolean) => void;
}>({
  setLoading: () => {},
});

export const usePageLoader = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Hide loader when path changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ setLoading: setIsLoading }}>
      {isLoading && <CreativeLoader />}
      {children}
    </LoadingContext.Provider>
  );
}

function CreativeLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative h-64 w-64 flex items-center justify-center">
        {/* Main Pulsing Heart Container */}
        <div className="relative h-32 w-32 animate-pulse z-10">
          <svg
            viewBox="0 0 24 24"
            className="h-full w-full fill-primary/20 stroke-primary stroke-[0.5]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>

          {/* EKG Line Drawing */}
          <svg
            viewBox="0 0 100 40"
            className="absolute inset-0 top-1/2 -translate-y-1/2 h-16 w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline
              points="0,20 20,20 25,10 35,30 45,5 55,35 65,20 80,20 100,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary animate-ekg"
              strokeDasharray="200"
              strokeDashoffset="200"
            />
          </svg>
        </div>

        {/* Orbiting Particles centered around heart */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           {[...Array(3)].map((_, i) => (
             <div 
               key={i}
               className={cn(
                 "absolute rounded-full border border-primary/10",
                 i === 0 ? "animate-spin-slow" : i === 1 ? "animate-spin-reverse" : "animate-pulse"
               )}
               style={{ 
                 width: `${160 + i * 40}px`,
                 height: `${160 + i * 40}px`,
                 animationDuration: `${3 + i}s`
               }}
             >
               <div className="h-2 w-2 rounded-full bg-primary/40 absolute top-0 left-1/2 -translate-x-1/2" />
             </div>
           ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes ekg {
          0% { stroke-dashoffset: 200; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
        .animate-ekg {
          animation: ekg 2s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
