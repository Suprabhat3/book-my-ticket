import React from "react";

export const Footer = () => {
  return (
    <footer className="w-full rounded-t-xl mt-20 bg-surface-container shadow-[inset_0_8px_16px_rgba(0,0,0,0.03)] clay-card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-between items-center px-12 py-16 w-full max-w-screen-2xl mx-auto">
        <div className="mb-8 lg:mb-0">
          <div className="text-lg font-bold text-on-surface mb-2 font-headline">
            Book Suprabhat's Ticket Experience
          </div>
          <p className="text-on-surface-variant font-body text-sm leading-relaxed max-w-xs">
            Redefining how you feel the movies. The world's first clay-molded
            digital ticketing experience.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 lg:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-primary uppercase tracking-widest text-xs">
              Navigation
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-all font-body text-sm"
                  href="#"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-all font-body text-sm"
                  href="#"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-all font-body text-sm"
                  href="#"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-primary uppercase tracking-widest text-xs">
              Social
            </h4>
            <div className="flex gap-4">
              <a
                href="https://x.com/suprabhat_3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:scale-110 transition-transform clay-inset"
              >
                <img
                  src="https://cdn.simpleicons.org/x"
                  alt="X"
                  className="w-4 h-4 opacity-80"
                />
              </a>
              <a
                href="https://github.com/suprabhat3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:scale-110 transition-transform clay-inset"
              >
                <img
                  src="https://cdn.simpleicons.org/github"
                  alt="GitHub"
                  className="w-4 h-4 opacity-80"
                />
              </a>
              <a
                href="https://www.linkedin.com/in/suprabhatt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:scale-110 transition-transform clay-inset"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="w-4 h-4 text-[#0A66C2]"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452H16.89v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.939v5.667H9.346V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.368-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zM7.119 20.452H3.555V9h3.564v11.452z" />
                </svg>
              </a>
              <a
                href="https://suprabhat.site/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio"
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:scale-110 transition-transform clay-inset"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  language
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="px-12 pb-8 text-center border-t border-surface-container-high pt-8">
        <p className="text-on-surface-variant font-body text-xs">
          © {new Date().getFullYear()} Book Suprabhat's Ticket Experience
        </p>
      </div>
    </footer>
  );
};
