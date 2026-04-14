import React from "react";
import Image from "next/image";
import { Button } from "./ui/Button";

export const Hero = () => {
  return (
    <section className="relative mb-24 overflow-hidden rounded-xl h-[600px] clay-inset bg-surface-container">
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-surface via-surface/40 to-transparent"></div>
      <Image
        alt="Cinematic Hero"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx0O1ZqerpKVMrFxAbKKXpnJ_chXsFbGU5A34ufrK7P0VjyKH9SbGBc4I8mnrP53nrgvN5hBqCgvSWg38TZPaGKP8_Q4VY5n9LUxOvhU5-toKyBvXvKyCVulwG-SXzWthjZb9SKcf1YJSj2oiMf5ApkXsCosttqynIuXy9JK3RHul3-H1kckzvfLPBiWmTGbL1GSZ80TbD0auoh-WsP8PGEoIPRkovO3sIGvsJTGTLNQhpP3fOkLyzkV72Xcoc8Pn8YMbbQOK_jtE"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      
      <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-2xl">
        <span className="text-primary font-bold tracking-widest text-sm mb-4 inline-block bg-primary/10 px-4 py-1 rounded-full w-fit">
          NOW SHOWING
        </span>
        <h1 className="text-7xl font-headline font-black text-on-surface leading-tight mb-6">
          The <span className="text-primary">Neon</span><br />Legacy
        </h1>
        <p className="text-lg text-on-surface-variant mb-10 leading-relaxed max-w-lg">
          Step into a world of hyper-tactile storytelling. Experience the latest blockbuster in our premium clay-molded ergonomic seating.
        </p>
        
        <div className="flex items-center gap-6">
          <Button variant="primary">
            <span className="material-symbols-outlined">confirmation_number</span>
            Book Now
          </Button>
          <Button variant="secondary">
            <span className="material-symbols-outlined">play_circle</span>
            Watch Trailer
          </Button>
        </div>
      </div>

      {/* Asymmetric Floating Poster Overlay */}
      <div className="absolute right-12 bottom-12 z-20 hidden xl:block">
        <div className="clay-card bg-surface-container-lowest p-4 rounded-lg rotate-3 hover:rotate-0 transition-transform duration-500">
          <div className="clay-inset rounded-lg overflow-hidden w-64 h-96 relative">
            <Image
              alt="Neon Legacy Poster"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe2P23vYaEU3fx2ngToPo49f_XOmBH-jow3YTii7WWKSaRXfnNgn2A--bAq1lJ7-_6SNFxcJT_IGbGFxwjjVbcfmFjgmZY8rFSYM9mtDeEUSSM-ED-roAWJJVT2d1Vkj7fl6KGwSH-z-zCSUxTzkUEZO6MHQg0vWXJn9WjzW7tB18j7PW6y3SOmEKaxZyD2xiRAYl3JmxZU5IiUVA60QU54PoSbhkDRBiG7QJf9d3rnMTzBkXPndbtjNmQUJM-fO0Nserbzmwnl68"
              fill
              sizes="256px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
