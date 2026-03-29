# small Talk

## What This Is
small Talk (usesmalltalk.com) helps local service businesses get more detailed Google reviews. Instead of dumping customers on a blank text box, it walks them through a quick, guided conversation about their experience. AI drafts a review from their honest inputs. They approve it and post it.

## The Philosophy
small Talk captures HONEST reviews, not positive reviews. A thoughtful 4-star review with real detail is more valuable than a generic 5-star review with no text — for the business, for future customers, and for us legally.

The flow adapts to the customer's actual experience. A 5-star experience and a 2-star experience are completely different conversations. The tool handles both with equal care.

For low ratings (1-2 stars), the customer gets a genuine choice: share publicly OR send private feedback directly to the business. Both options are equally prominent — this is NOT review gating. The private feedback path gives businesses a chance to make things right before it goes public. They either handle it or they don't. That's the value proposition: "Wouldn't you rather know first?"

## Tech Stack
- Next.js 14+ with App Router, TypeScript
- Tailwind CSS
- Supabase (auth + database) — later
- Claude API (Sonnet) for review generation — later
- Twilio for SMS — later
- Stripe for billing — later
- Deploy to Vercel

## Current Phase
Phase 1: Build the consumer review flow with hardcoded data. No backend yet.

---

## Design Identity — Consumer Flow

Warm, editorial, human. A premium concierge experience, not a corporate survey. Think Typeform meets Airbnb. Restrained confidence — let whitespace do the work.

### Typography (non-negotiable)
- Headings: `Fraunces` (Google Font), serif, weights 600/700
- Body: `DM Sans` (Google Font), sans-serif, weights 400/500/700
- NEVER use Inter, Roboto, Open Sans, or system fonts

### Color Palette (non-negotiable)
```
primary:    #E05A3D  /* Burnt orange — CTAs, active states, stars */
background: #F9F6F0  /* Warm off-white — page background, NEVER grey or pure white */
surface:    #FFFFFF  /* White cards floating ON the warm background */
text:       #1A2E25  /* Deep forest green — not black */
muted:      #8A9B93  /* Sage — secondary text, placeholders */
accent:     #DDE5DF  /* Soft sage — inactive states, outlines */
```

### Shape & Space
- Card radius: 16px. Pill radius: 99px.
- Card shadow: 0 8px 30px rgba(26, 46, 37, 0.08)
- Consumer flow: max-width 480px, centered
- Mobile-first. Design for 390px viewport.
- Generous padding. When in doubt, add more space.

### Animation Feel
- Subtle and effortless, not showy
- Transitions: ~300ms with slight movement
- Interactions should feel immediate and satisfying

---

## The Consumer Flow — Adaptive, Not Fixed

The flow is not a fixed number of screens. It adapts based on what the customer tells us. The number of screens depends on how many topics they want to talk about and what rating they gave.

### Core Flow:

**1. Welcome + Stars**
Personal greeting with the customer's name, the service performed, and the employee who helped. All pulled from URL parameters — the customer never enters info the business already provided. Large, tappable star rating.

**2. Topic Selection**
Neutral topic chips — NOT positive-only. Topics like Timeliness, Work Quality, Communication, Pricing, Professionalism, Cleanliness. These aren't praise — they're what the customer wants to mention. They pick the topics that are relevant to their experience.

**3. Follow-Up Per Topic (dynamic — one quick screen per selected topic)**
Each selected topic gets a single follow-up question with tappable options on a spectrum. Not good/bad binary — a real range.

Example: They selected "Timeliness" → "How was the timing?" → Early / Right on time / A bit late / Very late
Example: They selected "Communication" → "How was communication?" → Excellent / Good / Could improve / Poor
Example: They selected "Work Quality" → "How was the quality of work?" → Exceptional / Solid / Acceptable / Needs improvement

Each screen takes 2-3 seconds. Tap and advance. These are the inputs that make every review genuinely unique.

**4. Optional Detail**
An open text field for anything specific they want to add. Skip is always prominent and guilt-free. This is for the people who WANT to say something, not a requirement.

**5. Review Draft**
AI generates the review from their complete set of inputs — rating, topics, spectrum answers, optional text. The tone and content match what they actually said. A 4-star review that says "great quality but communication could improve" reads completely differently from a 5-star rave.

The customer can edit the text, regenerate for a different version, then copy and post to Google.

**6. Success**
Celebrates the submission, coaches them to paste in the Google tab, offers re-copy if needed.

### Branch: Low Rating (1-2 stars)
After stars, if the rating is 1 or 2, the flow offers two equally prominent paths:
- "Share your experience publicly" → continues through the normal topic/follow-up/draft flow, generating an honest critical review
- "Send private feedback to [Business Name]" → a simple text area that goes directly to the business owner, giving them a chance to respond and make it right

This is NOT review gating. Both paths are equal. The customer chooses. The private path is a genuine service — many unhappy customers would rather tell the business directly than post publicly, but they've never had the option.

---

## Technical Constraints
- Google Reviews API is read-only. Cannot submit reviews programmatically. Consumer must copy text to clipboard and paste into Google manually.
- Google is the primary review platform. Yelp is secondary.
- AI reviews must have natural variability — no two should read alike. The combination of rating + topics + spectrum answers + optional text creates hundreds of unique input combinations.
- Review tone must match the customer's actual sentiment. Enthusiastic inputs get enthusiastic language. Measured inputs get measured prose. Critical inputs get honest but fair criticism.

## Test Data (Phase 1)
```typescript
const TEST_DATA = {
  businessName: "Crystal Clear Pools",
  businessInitials: "CCP",
  employeeName: "Marcus",
  serviceType: "Weekly Pool Cleaning",
  customerName: "Alex",
  googleReviewUrl: "https://search.google.com/local/writereview?placeid=PLACEHOLDER",
  topics: [
    {
      label: "Timeliness",
      followUp: "How was the timing?",
      options: ["Early", "Right on time", "A bit late", "Very late"]
    },
    {
      label: "Work Quality",
      followUp: "How was the quality of work?",
      options: ["Exceptional", "Solid", "Acceptable", "Needs improvement"]
    },
    {
      label: "Communication",
      followUp: "How was communication?",
      options: ["Excellent", "Good", "Could improve", "Poor"]
    },
    {
      label: "Pricing",
      followUp: "How was the pricing?",
      options: ["Great value", "Fair", "A bit high", "Overpriced"]
    },
    {
      label: "Professionalism",
      followUp: "How professional was the service?",
      options: ["Outstanding", "Professional", "Adequate", "Unprofessional"]
    },
    {
      label: "Cleanliness",
      followUp: "How clean was the work area after?",
      options: ["Spotless", "Clean", "Mostly clean", "Left a mess"]
    }
  ],
  hardcodedReviews: {
    positive: "Marcus was fantastic. He showed up right on time for our weekly pool cleaning and the pool looks crystal clear. Really impressed with the attention to detail — highly recommend Crystal Clear Pools.",
    mixed: "Crystal Clear Pools does solid work — the pool always looks great after Marcus visits. Communication could be a little better though; I wasn't sure exactly when he'd arrive. Overall still a good experience and fair pricing.",
    negative: "Had some issues with my recent service. The tech arrived later than expected and I had trouble getting updates on the schedule. The pool cleaning itself was fine but the overall experience was frustrating."
  }
};
```

---

## Dashboard Design Identity (Phase 2)
Clean, professional, simple. Like checking your bank balance. Inspired by Square Dashboard, Venmo Business.

- Font: Inter for everything
- Primary: #0070EB (blue)
- Background: #F8F9FA, Surface: #FFFFFF
- Status dots: #00C853 (posted), #FF9800 (drafted), #F44336 (abandoned), #9E9E9E (sent)
- Border radius: 12px
- Mobile-first, max-width 600px centered

## Landing Page Design Identity (Phase 3)
Same warm aesthetic as consumer flow (Fraunces/DM Sans, #F9F6F0, #E05A3D) but:
- No drop shadows — 1px solid #E5D9C5 borders instead
- 160px between sections
- Scroll animations: 800ms fade-up
- Product screenshots in device mockups as primary selling visuals
