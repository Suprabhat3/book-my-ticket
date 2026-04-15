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
              <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:scale-110 transition-transform clay-inset">
                <span className="material-symbols-outlined text-on-surface-variant">
                  public
                </span>
              </button>
              <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:scale-110 transition-transform clay-inset">
                <span className="material-symbols-outlined text-on-surface-variant">
                  movie
                </span>
              </button>
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
