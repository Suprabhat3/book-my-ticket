import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Book Suprabhat's Ticket",
  description:
    "Learn the story behind the world's first clay-molded digital ticketing experience.",
};

const team = [
  {
    name: "Suprabhat",
    role: "Founder & Fullstack Engineer",
    bio: "Son of proud parents. Building Web & GenAI Software that (usually) work. Built this from the ground up during a 48-hour hackathon sprint.",
    initials: "S",
    color: "bg-primary/10 text-primary",
  },
];

const values = [
  {
    icon: "movie",
    title: "Cinema First",
    description:
      "Every decision is made through the lens of the movie-goer. We exist to make your night out effortless.",
  },
  {
    icon: "brush",
    title: "Tactile Design",
    description:
      "We believe interfaces should feel physical. Our claymorphism design system brings warmth to digital interactions.",
  },
  {
    icon: "bolt",
    title: "Blazing Fast",
    description:
      "From search to seat — every millisecond counts. We benchmark obsessively to guarantee a snappy experience.",
  },
  {
    icon: "lock",
    title: "Privacy by Default",
    description:
      "Your data is yours. We collect only what's essential, store it securely, and never sell it to third parties.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <section className="mb-24 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined text-base">info</span>
            About Us
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-on-surface mb-6 leading-tight">
            Cinema, reimagined{" "}
            <span className="text-primary">from the ground up.</span>
          </h1>
          <p className="text-on-surface-variant font-body text-lg leading-relaxed">
            Book Suprabhat&apos;s Ticket is the world&apos;s first clay-molded
            digital ticketing experience — where every tap feels as satisfying
            as sinking into a plush cinema chair.
          </p>
        </section>

        {/* Stats */}
        <section className="mb-24 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "48h", label: "Built in a hackathon" },
            { value: "100%", label: "Open source" },
            { value: "∞", label: "Movies to explore" },
            { value: "1", label: "Tactile design system" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="clay-card rounded-3xl p-8 text-center bg-surface-container-low"
            >
              <div className="text-4xl font-headline font-extrabold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-on-surface-variant font-body text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* Our Story */}
        <section className="mb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-headline font-extrabold mb-4 flex items-center gap-4">
              <span className="w-12 h-1 bg-primary rounded-full" />
              Our Story
            </h2>
            <p className="text-on-surface-variant font-body text-base leading-relaxed mb-4">
              It started with a single frustration: booking movie tickets online
              felt cold, clunky, and joyless. Why should the digital experience
              be so far removed from the magic of the cinema itself?
            </p>
            <p className="text-on-surface-variant font-body text-base leading-relaxed mb-4">
              So we set out to build something different. Something that feels
              warm, physical, and delightful — a booking platform that matches
              the excitement you feel before the lights go down.
            </p>
            <p className="text-on-surface-variant font-body text-base leading-relaxed">
              The result is our{" "}
              <span className="font-bold text-on-surface">
                Claymorphism design system
              </span>{" "}
              — soft shadows, rounded forms, and tactile interactions that make
              every click feel intentional.
            </p>
          </div>
          <div className="clay-card rounded-3xl p-10 bg-surface-container-low flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-primary text-3xl mt-1">
                format_quote
              </span>
              <p className="text-on-surface font-headline font-semibold text-xl leading-snug">
                We wanted booking a ticket to feel as good as watching the
                movie.
              </p>
            </div>
            <p className="text-on-surface-variant font-body text-sm pl-10">
              — Suprabhat, Founder
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-24">
          <h2 className="text-3xl font-headline font-extrabold mb-10 flex items-center gap-4">
            <span className="w-12 h-1 bg-primary rounded-full" />
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="clay-card rounded-3xl p-8 bg-surface-container-low flex flex-col gap-4 group hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center clay-inset">
                  <span className="material-symbols-outlined text-primary">
                    {value.icon}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-on-surface text-lg">
                  {value.title}
                </h3>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-24">
          <h2 className="text-3xl font-headline font-extrabold mb-10 flex items-center gap-4">
            <span className="w-12 h-1 bg-primary rounded-full" />
            The Team
          </h2>
          <div className="flex flex-wrap gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="clay-card rounded-3xl p-8 bg-surface-container-low flex flex-col gap-4 w-full max-w-sm"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-headline font-extrabold clay-inset ${member.color}`}
                >
                  {member.initials}
                </div>
                <div>
                  <div className="font-headline font-bold text-on-surface text-xl">
                    {member.name}
                  </div>
                  <div className="text-primary text-xs font-bold uppercase tracking-widest mt-1">
                    {member.role}
                  </div>
                </div>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="clay-card rounded-3xl p-12 bg-surface-container-low text-center">
          <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-4">
            Ready to book your next experience?
          </h2>
          <p className="text-on-surface-variant font-body mb-8 max-w-md mx-auto">
            Join thousands of movie lovers who&apos;ve already discovered a
            better way to book.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 clay-button-primary px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">movie</span>
            Browse Movies
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
