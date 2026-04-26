import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — small Talk",
  description: "Terms governing the use of small Talk.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-heading text-[24px] font-bold leading-tight text-text sm:text-[28px]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[16px] leading-[1.75] text-muted">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={index} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-body">
      <nav className="px-6 py-6">
        <Link href="/" className="font-heading text-[18px] font-bold text-text">
          small Talk
        </Link>
      </nav>

      <main className="mx-auto w-full max-w-[780px] flex-1 px-6 pb-20 pt-12">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
          Last updated April 25, 2026
        </p>
        <h1 className="mt-4 font-heading text-[36px] font-bold leading-tight text-text sm:text-[44px]">
          Terms of Service
        </h1>
        <p className="mt-8 text-[17px] leading-[1.75] text-muted">
          These Terms of Service (“Terms”) govern your access to and use of small Talk,
          including our website, dashboard, review flows, messaging tools, integrations,
          and related services (collectively, the “Service”).
        </p>
        <p className="text-[17px] leading-[1.75] text-muted">
          By using the Service, you agree to these Terms. If you are using the Service on
          behalf of a business or other organization, you represent that you have authority
          to bind that organization to these Terms.
        </p>
        <p className="text-[17px] leading-[1.75] text-muted">
          small Talk is operated by Small Talk LLC, a Texas limited liability company.
        </p>

        <Section title="1. What small Talk does">
          <p>
            small Talk helps businesses request customer reviews, collect private feedback,
            and draft review or reply text from real customer inputs. The Service may use
            artificial intelligence to help draft content, but customers and businesses are
            responsible for deciding whether to use, edit, copy, or post that content.
          </p>
          <p>
            The Service is a tool for facilitating review requests and related workflows. It
            is not a law firm, compliance service, or review platform, and it does not
            control how Google or other third-party platforms treat posted content.
          </p>
        </Section>

        <Section title="2. Eligibility and accounts">
          <p>
            You must be at least 18 years old and able to form a binding contract to use
            the Service as an account holder. You are responsible for maintaining the
            security of your account credentials and for all activity that occurs under your
            account.
          </p>
          <p>
            You agree to provide accurate information when creating and maintaining your
            account, including your business information and billing details.
          </p>
          <p>
            Review flows sent through the Service are intended for use by individuals who
            are at least 13 years old. Businesses are responsible for not knowingly sending
            review requests through the Service to children under 13.
          </p>
        </Section>

        <Section title="3. Your responsibilities when using the Service">
          <p>
            You are responsible for how you use small Talk. That includes the messages you
            send, the customer information you upload, and the way you use drafts generated
            through the Service.
          </p>
          <p>
            By using the Service, you represent and agree that:
          </p>
          <BulletList
            items={[
              <>you have the right to provide us with the customer information you submit;</>,
              <>you have a lawful basis to contact those customers by SMS, email, or other channels you use through the Service;</>,
              <>you will comply with applicable messaging, privacy, marketing, and consumer-protection laws;</>,
              <>you will honor opt-outs, do-not-contact requests, and platform rules;</>,
              <>you will review AI-assisted outputs before using or publishing them.</>,
            ]}
          />
        </Section>

        <Section title="4. Honest reviews, no fake reviews, and no manipulation">
          <p>
            small Talk is built around honest customer experiences. You may not use the
            Service to create fake reviews, misrepresent customer experiences, fabricate
            inputs, impersonate customers, or otherwise manipulate review platforms.
          </p>
          <BulletList
            items={[
              <>do not submit reviews for people who did not have a real experience;</>,
              <>do not offer incentives in a way that violates review-platform rules or applicable law;</>,
              <>do not use the Service to selectively steer positive reviews to public platforms while diverting negative reviews away from public platforms in a misleading or deceptive way;</>,
              <>do not rewrite customer experiences into something materially different from what the customer actually said.</>,
            ]}
          />
        </Section>

        <Section title="5. AI-assisted drafting">
          <p>
            small Talk may use third-party AI providers to generate review drafts, reply
            drafts, or related suggestions. Those drafts are generated from customer or
            business inputs. They are suggestions, not legal advice, compliance advice, or
            guarantees of platform acceptance.
          </p>
          <p>
            You are responsible for reviewing all AI-assisted outputs before sending,
            copying, posting, or relying on them.
          </p>
        </Section>

        <Section title="6. Customer-submitted content and public posting">
          <p>
            Customers control whether to post a public review. small Talk cannot post a
            Google review on a customer’s behalf. When a customer chooses to post publicly,
            they do so through Google or another third-party platform, and that activity is
            also governed by that platform’s own terms and policies.
          </p>
          <p>
            If a customer chooses to send private feedback, that feedback is delivered to
            the business through the Service.
          </p>
        </Section>

        <Section title="7. Subscription, trials, billing, and cancellations">
          <p>
            Paid features may require a subscription. Trials, pricing, and plan details may
            be described on our website or in the dashboard. Billing is processed through
            Stripe or another payment processor we may designate.
          </p>
          <BulletList
            items={[
              <>subscriptions may renew automatically unless canceled before renewal;</>,
              <>trial access may convert into a paid plan unless canceled before the trial ends;</>,
              <>you authorize us and our payment processor to charge applicable subscription fees, taxes, and other agreed charges;</>,
              <>unless required by law, fees already paid are non-refundable.</>,
            ]}
          />
          <p>
            Trial details, including duration and any conversion terms, are provided at
            signup, checkout, or in the dashboard. If a trial converts into a paid
            subscription, the pricing and timing presented at that point of signup or
            checkout will control.
          </p>
          <p>
            You can manage billing and cancellations through the billing portal or by
            contacting us. Changes to pricing will apply prospectively after notice as
            required by law.
          </p>
          <p>
            Unless we expressly state otherwise in writing, subscriptions are offered
            without a service-level agreement and may be changed, suspended, or discontinued
            in accordance with these Terms and applicable law.
          </p>
        </Section>

        <Section title="8. Acceptable use restrictions">
          <p>
            You may not:
          </p>
          <BulletList
            items={[
              <>use the Service for unlawful, abusive, fraudulent, deceptive, or harmful activity;</>,
              <>send spam or unwanted messages through the Service;</>,
              <>attempt to bypass rate limits, access controls, or security protections;</>,
              <>reverse engineer, scrape, or copy the Service except as allowed by law;</>,
              <>interfere with the operation, security, or stability of the Service;</>,
              <>use the Service to build or train a competing product from our outputs, prompts, or workflows.</>,
            ]}
          />
        </Section>

        <Section title="9. APIs and integrations">
          <p>
            If we provide API keys, webhooks, or integrations, you are responsible for
            keeping credentials secure and for all activity performed with those credentials.
            We may suspend or rotate credentials that we believe are compromised, abusive,
            or non-compliant.
          </p>
          <p>
            You are also responsible for ensuring that your connected systems, automations,
            and internal workflows use the Service in a compliant and non-deceptive manner.
          </p>
        </Section>

        <Section title="10. Ownership and intellectual property">
          <p>
            small Talk and its software, branding, design, and related materials are owned
            by us or our licensors and are protected by law. Subject to these Terms, we
            grant you a limited, non-exclusive, non-transferable, revocable right to use
            the Service for your internal business use.
          </p>
          <p>
            You retain ownership of content you submit to the Service, subject to the rights
            you grant us to host, process, transmit, analyze, and display that content as
            needed to operate, maintain, and improve the Service.
          </p>
          <p>
            If you believe content on the Service infringes your rights or was used without
            permission, contact us at{" "}
            <a
              href="mailto:hello@usesmalltalk.com"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              hello@usesmalltalk.com
            </a>{" "}
            with a description of the claim.
          </p>
        </Section>

        <Section title="11. Suspension and termination">
          <p>
            We may suspend or terminate access to the Service if you violate these Terms,
            create legal or security risk, fail to pay fees when due, or use the Service in
            a way that could harm us, our users, or third parties.
          </p>
          <p>
            You may stop using the Service at any time. Certain obligations, including
            payment obligations, usage restrictions, disclaimers, and limitations of
            liability, survive termination.
          </p>
          <p>
            Upon termination, we may retain your data for a reasonable period as needed to
            comply with legal obligations, resolve disputes, prevent abuse, or enforce these
            Terms. You may request deletion of account data by contacting us at{" "}
            <a
              href="mailto:hello@usesmalltalk.com"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              hello@usesmalltalk.com
            </a>
            .
          </p>
        </Section>

        <Section title="12. Disclaimers">
          <p>
            The Service is provided on an “as is” and “as available” basis. To the maximum
            extent permitted by law, we disclaim all warranties, whether express, implied,
            or statutory, including warranties of merchantability, fitness for a particular
            purpose, non-infringement, and uninterrupted availability.
          </p>
          <p>
            We do not guarantee that review platforms will accept, publish, rank, or retain
            any review, or that the Service will be error-free or uninterrupted.
          </p>
          <p>
            The Service depends on third-party providers and platforms, including messaging
            carriers, payment processors, hosting providers, analytics providers, AI
            providers, and review platforms such as Google. We are not responsible for the
            availability, accuracy, or conduct of those third-party services.
          </p>
        </Section>

        <Section title="13. Limitation of liability">
          <p>
            To the maximum extent permitted by law, small Talk and its affiliates, officers,
            employees, and service providers will not be liable for any indirect,
            incidental, special, consequential, exemplary, or punitive damages, or for any
            loss of profits, revenues, goodwill, data, or business opportunities, arising
            out of or related to the Service or these Terms.
          </p>
          <p>
            To the maximum extent permitted by law, our total liability for claims arising
            out of or related to the Service or these Terms will not exceed the greater of
            (a) the amount you paid us in the 12 months before the claim arose or (b)
            $100.
          </p>
        </Section>

        <Section title="14. Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless small Talk and its affiliates,
            officers, employees, and service providers from and against claims, liabilities,
            damages, losses, and expenses arising out of or related to:
          </p>
          <BulletList
            items={[
              <>your use of the Service;</>,
              <>your content, customer data, or messages;</>,
              <>your violation of these Terms;</>,
              <>your violation of applicable law or third-party platform rules;</>,
              <>your misuse of AI-generated outputs, review requests, or integrations.</>,
            ]}
          />
        </Section>

        <Section title="15. Governing law and disputes">
          <p>
            These Terms are governed by the laws of the State of Texas, without regard to
            conflict-of-law principles. To the extent permitted by law, disputes arising out
            of or related to these Terms or the Service will be resolved in the state or
            federal courts located in Texas, unless applicable law requires otherwise.
          </p>
        </Section>

        <Section title="16. Force majeure">
          <p>
            We are not liable for failures or delays caused by circumstances beyond our
            reasonable control, including natural disasters, internet outages, infrastructure
            failures, carrier disruptions, labor disputes, government actions, or failures
            of third-party service providers.
          </p>
        </Section>

        <Section title="17. Changes to these Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we
            will update the “Last updated” date above and may provide additional notice
            where appropriate. Your continued use of the Service after the updated Terms
            take effect means you accept the updated Terms.
          </p>
        </Section>

        <Section title="18. Contact us">
          <p>
            Questions about these Terms can be sent to Small Talk LLC at{" "}
            <a
              href="mailto:hello@usesmalltalk.com"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              hello@usesmalltalk.com
            </a>
            . Small Talk LLC is organized under the laws of Texas.
          </p>
        </Section>
      </main>
    </div>
  );
}
