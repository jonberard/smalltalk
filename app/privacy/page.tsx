import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — small Talk",
  description: "How small Talk collects, uses, shares, and protects personal information.",
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

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-8 text-[17px] leading-[1.75] text-muted">
          This Privacy Policy explains how small Talk (“small Talk,” “we,” “us,” or “our”)
          collects, uses, shares, and protects personal information when people visit our
          website, use our software, receive a review request through our platform, or
          otherwise interact with us.
        </p>
        <p className="text-[17px] leading-[1.75] text-muted">
          small Talk helps service businesses send customers to a guided review flow,
          collect private feedback, and draft public review text from a customer’s real
          inputs. Because our product is used by both business owners and their customers,
          this policy covers both kinds of interactions.
        </p>
        <p className="text-[17px] leading-[1.75] text-muted">
          small Talk is operated by Small Talk LLC, a Texas limited liability company.
        </p>
        <p className="text-[17px] leading-[1.75] text-muted">
          This policy is meant to describe our own privacy practices. If a business uses
          small Talk to contact its customers, that business may also have its own privacy
          notice or legal obligations that apply to the customer relationship.
        </p>

        <Section title="1. Who this policy covers">
          <p>
            This policy applies to:
          </p>
          <BulletList
            items={[
              <>
                business owners, staff members, and account users who use the small Talk
                dashboard or website;
              </>,
              <>
                customers who receive a review request or submit public-review inputs or
                private feedback through a small Talk review flow; and
              </>,
              <>
                people who contact us for support, sales, or other inquiries.
              </>,
            ]}
          />
          <p>
            In many cases, the business that invited a customer into a review flow controls
            the underlying customer relationship. small Talk processes that information so
            we can provide the service to that business.
          </p>
          <p>
            That means a customer may have rights both with respect to small Talk and with
            respect to the business that sent the review request.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>
            The information we collect depends on how you use small Talk.
          </p>

          <h3 className="font-heading text-[20px] font-bold text-text">
            Information collected from business owners and account users
          </h3>
          <BulletList
            items={[
              <>name, business name, and email address;</>,
              <>password and authentication-related information;</>,
              <>business profile information, including logo, city, neighborhoods, Google review or place links, service names, and team member names;</>,
              <>review request templates, reply voice preferences, reminder settings, quiet hours, time zone, and batch-send settings;</>,
              <>billing and subscription information, including subscription status, trial usage, Stripe customer and subscription references, and billing portal activity;</>,
              <>support requests, help-center messages, and account communications.</>,
            ]}
          />

          <h3 className="font-heading text-[20px] font-bold text-text">
            Information businesses submit about their customers
          </h3>
          <BulletList
            items={[
              <>customer names;</>,
              <>customer phone numbers and email addresses;</>,
              <>service type and employee or technician names associated with a visit;</>,
              <>review request scheduling and delivery information.</>,
            ]}
          />

          <h3 className="font-heading text-[20px] font-bold text-text">
            Information customers provide through the review flow
          </h3>
          <BulletList
            items={[
              <>star ratings;</>,
              <>topics selected and follow-up answers about the customer’s experience;</>,
              <>optional written details or comments;</>,
              <>private feedback messages submitted to a business;</>,
              <>edited or approved review draft text;</>,
              <>
                optional voice-input transcripts if the customer uses browser speech
                recognition features in the review flow.
              </>,
            ]}
          />
          <p>
            We do not intentionally ask customers to provide sensitive personal information,
            such as medical information, government IDs, or financial account numbers,
            through the review flow.
          </p>

          <h3 className="font-heading text-[20px] font-bold text-text">
            Information collected automatically
          </h3>
          <BulletList
            items={[
              <>IP address, browser type, device information, operating system, and referral data;</>,
              <>pages viewed, app events, clicks, usage behavior, and feature interactions;</>,
              <>session, cookie, and local-storage identifiers used for authentication, analytics, and product functionality;</>,
              <>message delivery logs, review-link status, and reminder activity;</>,
              <>
                limited session replay and diagnostic analytics on dashboard pages, with
                text and input masking enabled.
              </>,
            ]}
          />
        </Section>

        <Section title="3. How we use information">
          <BulletList
            items={[
              <>provide, operate, secure, and improve the small Talk product;</>,
              <>create and manage business accounts and onboarding flows;</>,
              <>send review requests, reminders, emails, and SMS messages;</>,
              <>generate AI-drafted review text and AI-drafted public-review replies from user-provided inputs;</>,
              <>deliver private feedback to businesses and help businesses manage customer follow-up;</>,
              <>process billing, subscriptions, trials, and account access;</>,
              <>monitor product usage, diagnose bugs, and analyze product performance;</>,
              <>enforce our Terms, prevent abuse, and protect the security and integrity of the service;</>,
              <>comply with legal obligations and respond to lawful requests.</>,
            ]}
          />
          <p>
            Where applicable law requires a legal basis for processing, we generally rely
            on one or more of the following: performance of a contract, legitimate
            interests in operating and improving the Service, consent where required, and
            compliance with legal obligations.
          </p>
        </Section>

        <Section title="4. How the review flow works">
          <p>
            small Talk is designed to capture honest reviews, not to fabricate customer
            experiences. When a customer goes through a review flow, the customer may
            provide a rating, choose topics, answer follow-up questions, add optional
            details, or choose to send private feedback. small Talk may use those inputs to
            generate a review draft or a business-owner reply draft with the help of AI
            providers.
          </p>
          <p>
            If a customer uses voice input in a supported browser, speech recognition
            processing occurs through the browser feature itself. small Talk generally
            receives the resulting text transcript, not a raw audio recording.
          </p>
          <p>
            If a customer chooses to send private feedback, that feedback is delivered to
            the business that requested it. If a customer chooses to post publicly, the
            customer is responsible for deciding whether to copy, edit, and post the draft
            to Google or another public platform.
          </p>
        </Section>

        <Section title="5. When we share information">
          <p>
            We do not sell personal information. We share information only as needed to
            operate the service, support customers, comply with law, or protect the
            platform.
          </p>

          <h3 className="font-heading text-[20px] font-bold text-text">
            Service providers and subprocessors
          </h3>
          <p>
            We may share information with vendors that help us run small Talk, including:
          </p>
          <BulletList
            items={[
              <>
                <strong className="text-text">Supabase</strong> for database, authentication,
                and application storage;
              </>,
              <>
                <strong className="text-text">Twilio</strong> for SMS delivery and opt-out
                handling;
              </>,
              <>
                <strong className="text-text">Resend</strong> for email delivery;
              </>,
              <>
                <strong className="text-text">Stripe</strong> for billing, checkout, and
                subscription management;
              </>,
              <>
                <strong className="text-text">PostHog</strong> for analytics and masked
                session replay on dashboard pages;
              </>,
              <>
                <strong className="text-text">AI providers</strong>, including Anthropic,
                OpenAI, and Google Gemini, when used to generate review or reply drafts;
              </>,
              <>
                <strong className="text-text">Vercel</strong> for hosting and related
                infrastructure.
              </>,
            ]}
          />
          <p>
            When customer or business inputs are sent to AI providers, they are sent
            through API calls to generate the requested draft or suggestion. We do not use
            those inputs to train our own models. Third-party AI providers may process or
            retain submitted data according to their own policies and the agreements we have
            with them.
          </p>

          <h3 className="font-heading text-[20px] font-bold text-text">
            Sharing with businesses
          </h3>
          <p>
            If you are a customer using a review flow sent by a business, information you
            submit through that flow may be shared with that business, including ratings,
            topic selections, optional notes, private feedback, and certain review-flow
            status data.
          </p>
          <p>
            Third-party services such as Google, Stripe, and Twilio also have their own
            privacy practices. This policy does not govern how those third parties handle
            information once it leaves small Talk and is processed under their own terms.
          </p>

          <h3 className="font-heading text-[20px] font-bold text-text">
            Legal and safety disclosures
          </h3>
          <p>
            We may disclose information if required by law, subpoena, court order, or
            other valid legal process, or if we believe disclosure is reasonably necessary
            to protect the rights, safety, security, or property of small Talk, our users,
            or others.
          </p>
          <p>
            Personal information may be transferred to and processed in the United States
            or other jurisdictions where our service providers operate. Where applicable, we
            rely on contractual and technical safeguards that are reasonably intended to
            protect transferred personal information.
          </p>
        </Section>

        <Section title="6. Cookies, analytics, and similar technologies">
          <p>
            We use cookies, local storage, and similar technologies to keep users signed
            in, remember settings, protect accounts, and understand how people use the
            product and website.
          </p>
          <BulletList
            items={[
              <>essential technologies used for authentication, session security, and core product functionality;</>,
              <>functional technologies used to remember settings and user preferences;</>,
              <>analytics technologies used to understand website and product usage, including PostHog.</>,
            ]}
          />
          <p>
            We also use analytics tools, including PostHog, to understand product usage and
            improve the service. Dashboard session replay is configured with masking so text
            and input values are not intentionally captured in readable form.
          </p>
          <p>
            We do not use third-party advertising cookies, and we do not currently respond
            to Do Not Track browser signals.
          </p>
          <p>
            You can usually control cookies through your browser settings. Disabling some
            cookies may affect how the service works.
          </p>
        </Section>

        <Section title="7. Data retention">
          <p>
            We retain personal information for as long as reasonably necessary to provide
            the service, maintain security and integrity, comply with legal obligations,
            resolve disputes, and enforce our agreements.
          </p>
          <BulletList
            items={[
              <>account, business, and subscription data are generally retained while the account remains active and for a reasonable period afterward;</>,
              <>review-flow submissions, private feedback, delivery logs, and request history may be retained to support the product, troubleshooting, and business reporting;</>,
              <>
                opt-out and suppression information may be retained longer so we can honor
                do-not-contact requests.
              </>,
            ]}
          />
          <p>
            We do not assign a single retention period to every data type. Instead, we
            retain information based on the purpose for which it was collected, the needs of
            the business using the Service, legal requirements, dispute-resolution needs,
            and security or abuse-prevention considerations.
          </p>
        </Section>

        <Section title="8. Data security">
          <p>
            We use reasonable technical and organizational safeguards intended to protect
            personal information from unauthorized access, loss, misuse, alteration, or
            disclosure. No method of transmission or storage is completely secure, and we
            cannot guarantee absolute security.
          </p>
          <p>
            These safeguards include measures such as encrypted data transmission, signed
            session or authentication tokens, access controls on administrative functions,
            and provider-level controls offered by the infrastructure and payment services
            we use.
          </p>
        </Section>

        <Section title="9. Your choices and rights">
          <p>
            Depending on your relationship to small Talk and where you live, you may have
            rights to access, correct, delete, or export certain personal information, or
            to object to or limit certain processing.
          </p>
          <BulletList
            items={[
              <>
                <strong className="text-text">Business owners</strong> can update much of
                their account and business information inside the dashboard.
              </>,
              <>
                <strong className="text-text">Business owners</strong> may also request
                deletion of their account data through the dashboard or by contacting us,
                subject to the retention practices described in Section 7.
              </>,
              <>
                <strong className="text-text">Customers</strong> who submit private
                feedback or review-flow inputs may contact us or the business that sent the
                review request to ask about deletion or access.
              </>,
              <>
                Anyone can contact us at{" "}
                <a
                  href="mailto:hello@usesmalltalk.com"
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                >
                  hello@usesmalltalk.com
                </a>{" "}
                to request help with privacy questions.
              </>,
            ]}
          />
          <p>
            We do not sell personal information and we do not share personal information for
            cross-context behavioral advertising as those terms are commonly used in U.S.
            state privacy laws.
          </p>
          <p>
            California residents may have additional rights under California privacy law,
            including the right to know what personal information we collect, the right to
            request deletion, and the right to opt out of the sale of personal information.
            We do not sell personal information.
          </p>
          <p>
            Customers who receive SMS messages through small Talk can reply STOP to opt out
            of future text messages. We retain opt-out preferences so we can continue to
            honor them.
          </p>
          <p>
            To exercise privacy-related rights or ask a privacy question, contact us at{" "}
            <a
              href="mailto:hello@usesmalltalk.com"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              hello@usesmalltalk.com
            </a>
            . We may need to verify your identity before fulfilling certain requests.
          </p>
        </Section>

        <Section title="10. Children’s privacy">
          <p>
            small Talk is not directed to children under 13, and we do not knowingly
            collect personal information from children under 13. If you believe a child has
            provided personal information through the service, contact us and we will take
            appropriate steps.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. If we make material
            changes, we will update the “Last updated” date above and may provide additional
            notice where appropriate.
          </p>
        </Section>

        <Section title="12. Contact us">
          <p>
            If you have questions about this Privacy Policy or our privacy practices,
            contact Small Talk LLC at{" "}
            <a
              href="mailto:hello@usesmalltalk.com"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              hello@usesmalltalk.com
            </a>
            . Small Talk LLC is based in Texas.
          </p>
        </Section>
      </main>
    </div>
  );
}
