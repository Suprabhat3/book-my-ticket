import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Book Suprabhat's Ticket",
  description:
    "Understand how Book Suprabhat's Ticket collects, uses, and protects your personal data.",
};

const sections = [
  {
    icon: "database",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect your name, email address, and a hashed password. We never store your password in plain text.",
      },
      {
        subtitle: "Booking Data",
        text: "We store records of your bookings — including movie, show time, seat selection, and payment confirmation — to provide your booking history and generate tickets.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect anonymised usage data (pages visited, clicks, session duration) to improve our product. This data is not linked to your identity.",
      },
    ],
  },
  {
    icon: "visibility",
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Service Delivery",
        text: "Your account and booking data is used solely to provide the booking service — confirming reservations, generating QR tickets, and sending booking confirmations.",
      },
      {
        subtitle: "Communication",
        text: "We may send transactional emails (booking confirmations, receipts). We do not send marketing emails without your explicit opt-in consent.",
      },
      {
        subtitle: "Product Improvement",
        text: "Anonymised analytics help us understand which features work well and which ones need polish. No personally identifiable data is used for this purpose.",
      },
    ],
  },
  {
    icon: "share",
    title: "Data Sharing",
    content: [
      {
        subtitle: "We Never Sell Your Data",
        text: "Your personal information is never sold to, rented to, or shared with third-party advertisers or data brokers. Period.",
      },
      {
        subtitle: "Service Providers",
        text: "We may share data with trusted infrastructure providers (hosting, email delivery) who process data strictly on our behalf and are bound by confidentiality agreements.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required by law, court order, or government authority, and only to the minimum extent necessary.",
      },
    ],
  },
  {
    icon: "lock",
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is transmitted over HTTPS (TLS 1.2+). Passwords are hashed using industry-standard bcrypt before storage.",
      },
      {
        subtitle: "Access Controls",
        text: "Access to production data is restricted to authorised personnel only and is protected by multi-factor authentication.",
      },
      {
        subtitle: "Incident Response",
        text: "In the unlikely event of a breach, we will notify affected users within 72 hours and take immediate remediation steps.",
      },
    ],
  },
  {
    icon: "manage_accounts",
    title: "Your Rights",
    content: [
      {
        subtitle: "Access & Portability",
        text: "You can request a copy of all personal data we hold about you at any time by contacting us at privacy@suprabhat.site.",
      },
      {
        subtitle: "Deletion",
        text: "You may request deletion of your account and associated data. We will process requests within 30 days, except where retention is required by law.",
      },
      {
        subtitle: "Correction",
        text: "If any information we hold about you is inaccurate, you may update it through your account settings or by contacting us directly.",
      },
    ],
  },
  {
    icon: "cookie",
    title: "Cookies",
    content: [
      {
        subtitle: "Essential Cookies Only",
        text: "We use only essential session cookies required for authentication and booking flow. We do not use tracking or advertising cookies.",
      },
      {
        subtitle: "Local Storage",
        text: "We use browser local storage to persist your authentication token client-side. This data never leaves your device except as part of authorised API calls.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-8 py-16">
        {/* Header */}
        <section className="mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined text-base">policy</span>
            Privacy Policy
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-on-surface mb-6 leading-tight">
            Your privacy,{" "}
            <span className="text-primary">our responsibility.</span>
          </h1>
          <p className="text-on-surface-variant font-body text-lg leading-relaxed mb-4">
            We believe privacy is a fundamental right, not an afterthought. This
            policy explains plainly what data we collect, why we collect it, and
            how we protect it.
          </p>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-body">
            <span className="material-symbols-outlined text-base">
              calendar_today
            </span>
            Last updated: April 15, 2026
          </div>
        </section>

        {/* Quick Summary */}
        <section className="mb-16">
          <div className="clay-card rounded-3xl p-8 bg-surface-container-low border-l-4 border-primary">
            <h2 className="font-headline font-bold text-on-surface text-xl mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                summarize
              </span>
              TL;DR — The Plain English Summary
            </h2>
            <ul className="flex flex-col gap-3">
              {[
                "We collect only what's needed to run the booking service.",
                "We never sell your personal data to anyone.",
                "Your password is hashed — we can't read it.",
                "You can delete your account and all data at any time.",
                "We use no advertising or tracking cookies.",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 font-body text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">
                    check_circle
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Sections */}
        <div className="flex flex-col gap-8 mb-16">
          {sections.map((section, index) => (
            <section key={section.title} className="clay-card rounded-3xl p-8 bg-surface-container-low">
              <h2 className="font-headline font-extrabold text-on-surface text-2xl mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 clay-inset flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {section.icon}
                  </span>
                </div>
                <span className="text-on-surface-variant text-sm font-body font-normal mr-2">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.content.map((item) => (
                  <div key={item.subtitle} className="flex flex-col gap-2">
                    <h3 className="font-headline font-bold text-on-surface text-base">
                      {item.subtitle}
                    </h3>
                    <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <section className="clay-card rounded-3xl p-10 bg-surface-container-low text-center">
          <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-3">
            Questions about your privacy?
          </h2>
          <p className="text-on-surface-variant font-body text-sm mb-6 max-w-md mx-auto">
            Reach out to us directly. We aim to respond to all privacy-related
            requests within 48 hours.
          </p>
          <a
            href="mailto:privacy@suprabhat.site"
            className="inline-flex items-center gap-2 clay-button-primary px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">mail</span>
            Contact Us
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
