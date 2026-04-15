import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Book Suprabhat's Ticket",
  description:
    "The terms and conditions governing your use of Book Suprabhat's Ticket.",
};

const terms = [
  {
    icon: "gavel",
    number: "01",
    title: "Acceptance of Terms",
    paragraphs: [
      "By accessing or using Book Suprabhat's Ticket (the \"Service\"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.",
      "We reserve the right to update these terms at any time. Continued use of the Service after changes are published constitutes your acceptance of the revised terms. We will notify you of significant changes via email.",
    ],
  },
  {
    icon: "account_circle",
    number: "02",
    title: "User Accounts",
    paragraphs: [
      "You must create an account to book tickets. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
      "You agree to provide accurate, current, and complete information during registration and to update this information to keep it accurate. We reserve the right to suspend or terminate accounts that contain false information.",
      "You must be at least 13 years of age to create an account. By registering, you represent that you meet this age requirement.",
    ],
  },
  {
    icon: "confirmation_number",
    number: "03",
    title: "Booking & Tickets",
    paragraphs: [
      "All bookings are subject to availability and confirmation. A booking is only confirmed once you receive a confirmation email and a valid QR ticket.",
      "Tickets are non-transferable and non-refundable unless the show is cancelled or rescheduled by the cinema. In such cases, a full refund will be issued to the original payment method within 5–10 business days.",
      "You are responsible for arriving at the cinema on time. The Service cannot be held liable for denied entry due to late arrival.",
    ],
  },
  {
    icon: "payments",
    number: "04",
    title: "Payments",
    paragraphs: [
      "All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify pricing at any time.",
      "Payment is processed securely. We do not store your full card details on our servers. All payment data is handled by PCI-DSS compliant payment processors.",
      "In the event of a payment dispute, please contact us within 7 days of the transaction. Chargebacks initiated without prior contact may result in account suspension.",
    ],
  },
  {
    icon: "block",
    number: "05",
    title: "Prohibited Conduct",
    paragraphs: [
      "You agree not to use the Service for any unlawful purpose, or in any way that could damage, disable, or impair the Service.",
      "You must not attempt to gain unauthorized access to any portion of the Service, other accounts, or computer systems connected to the Service.",
      "Bot activity, automated reservation scripts, ticket scalping, and resale of tickets at a premium are strictly prohibited and may result in immediate account termination and legal action.",
    ],
  },
  {
    icon: "copyright",
    number: "06",
    title: "Intellectual Property",
    paragraphs: [
      "The Service and its original content, features, and functionality are owned by Suprabhat and are protected by applicable copyright, trademark, and other intellectual property laws.",
      "Movie posters, descriptions, and related content are the property of their respective studios and rights holders. We display such content under license or fair use for the purpose of facilitating ticket sales.",
      "You may not reproduce, distribute, or create derivative works from our proprietary content without express written permission.",
    ],
  },
  {
    icon: "shield_with_heart",
    number: "07",
    title: "Limitation of Liability",
    paragraphs: [
      "The Service is provided on an \"as is\" and \"as available\" basis. We make no warranties, expressed or implied, regarding the reliability, accuracy, or availability of the Service.",
      "To the maximum extent permitted by law, Suprabhat shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.",
      "Our total liability to you for any claim arising from use of the Service shall not exceed the amount you paid for the specific booking giving rise to the claim.",
    ],
  },
  {
    icon: "balance",
    number: "08",
    title: "Governing Law",
    paragraphs: [
      "These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.",
      "Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in India.",
      "If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-8 py-16">
        {/* Header */}
        <section className="mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined text-base">gavel</span>
            Terms of Service
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-on-surface mb-6 leading-tight">
            Simple rules,{" "}
            <span className="text-primary">fairly applied.</span>
          </h1>
          <p className="text-on-surface-variant font-body text-lg leading-relaxed mb-4">
            These terms govern your use of the Service. We&apos;ve written them
            to be as clear and jargon-free as possible. Please read them before
            using the platform.
          </p>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-body">
            <span className="material-symbols-outlined text-base">
              calendar_today
            </span>
            Last updated: April 15, 2026
          </div>
        </section>

        {/* Quick Nav */}
        <section className="mb-16">
          <div className="clay-card rounded-3xl p-6 bg-surface-container-low">
            <h2 className="font-headline font-bold text-on-surface text-base mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                list
              </span>
              Table of Contents
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {terms.map((term) => (
                <li key={term.number}>
                  <a
                    href={`#section-${term.number}`}
                    className="flex items-center gap-2 text-sm font-body text-on-surface-variant hover:text-primary transition-colors group"
                  >
                    <span className="text-xs font-bold text-primary/50 group-hover:text-primary transition-colors">
                      {term.number}
                    </span>
                    {term.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Terms Sections */}
        <div className="flex flex-col gap-8 mb-16">
          {terms.map((term) => (
            <section
              key={term.number}
              id={`section-${term.number}`}
              className="clay-card rounded-3xl p-8 bg-surface-container-low scroll-mt-24"
            >
              <div className="flex items-start gap-5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 clay-inset flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">
                    {term.icon}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-primary/50 uppercase tracking-widest mb-1">
                    Section {term.number}
                  </div>
                  <h2 className="font-headline font-extrabold text-on-surface text-2xl">
                    {term.title}
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-4 pl-0 md:pl-17">
                {term.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="text-on-surface-variant font-body text-sm leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact + Agreement */}
        <section className="clay-card rounded-3xl p-10 bg-surface-container-low text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 clay-inset flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-2xl">
              handshake
            </span>
          </div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-3">
            Questions about these terms?
          </h2>
          <p className="text-on-surface-variant font-body text-sm mb-8 max-w-md mx-auto">
            If anything is unclear or you disagree with part of these terms,
            please reach out before using the Service.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:legal@suprabhat.site"
              className="inline-flex items-center gap-2 clay-button-primary px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              Contact Legal
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 clay-button-secondary px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all text-secondary"
            >
              <span className="material-symbols-outlined text-base">home</span>
              Back to Home
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
