# Owner Help Center Plan

Last updated: April 21, 2026

## Purpose

This is the build brief for the owner-facing help center inside the dashboard.

The goal is not to create a bloated docs product.

The goal is to answer the real questions a business owner will ask when they are:
- confused
- nervous
- checking whether the product is working
- trying to decide what to do next

This should feel like:
- calm guidance
- plain-English product truth
- founder-led help

Not:
- enterprise documentation
- a generic FAQ wall
- support-center clutter

---

## What Owners Are Really Asking

Most owner questions collapse into one of these anxieties:

1. `Is this working?`
2. `Did they actually post the review?`
3. `Did a bad review just go public?`
4. `What am I supposed to do next?`
5. `Why doesn’t the dashboard match reality exactly?`
6. `Am I using the right kind of link?`

That means the help center should not be organized around product departments.
It should be organized around owner confusion.

---

## Recommended Structure

Primary direction:
- guided/workflow-first

Secondary support:
- searchable topics
- common questions
- founder contact

Best home-page mental model:
1. `Start here`
2. `How it works`
3. `Common situations`
4. `Status guide`
5. `Links and reminders`
6. `Still stuck? Message the founder`

Recommendation:
- keep the route at `/dashboard/support` for now to avoid churn
- change the page framing from `Support` to `Help`
- treat the founder message form as part of the help center, not the whole page

---

## V1 Information Architecture

### Home
- `Help Center`
- Short founder-led intro
- `How small Talk works`
- `Most common questions`
- `Jump to a topic`
- `Message the founder`

### Article routes

Recommended first routes:
- `/dashboard/support/how-it-works`
- `/dashboard/support/what-copied-means`
- `/dashboard/support/low-ratings-and-private-feedback`
- `/dashboard/support/handling-private-feedback`
- `/dashboard/support/personalized-links-vs-qr`
- `/dashboard/support/how-reminders-work`
- `/dashboard/support/why-a-review-may-not-appear`
- `/dashboard/support/what-to-do-when-a-customer-doesnt-finish`

If we want to keep implementation lighter at first:
- one home page
- three article pages
- message founder block at the bottom of all of them

---

## V1 Build Order

Build in this order:

1. `Help Center home`
2. `How small Talk works`
3. `What "Copied" actually means`
4. `Personalized links vs QR/shared links`
5. `Low ratings, private feedback, and what happens next`
6. `How to handle private feedback`
7. `How reminders work`
8. `Why a review may not appear on Google`
9. `What to do when a customer doesn’t finish`

Why this order:
- it answers trust-threatening questions first
- it reduces “is this broken?” support load first
- it helps owners choose the right workflow before we fill in edge cases

---

## Article Template

Every help article should follow the same structure.

### 1. What this is
One sentence explaining the topic.

### 2. Short answer
Give the direct answer immediately.

### 3. How it works
Explain the mechanism in plain English.

### 4. What this means in practice
Translate it into owner action.

### 5. Common confusion
Call out the most likely misunderstanding.

### 6. What to do next
Tell the owner what action to take.

### 7. Still need help?
Founder message CTA + support email

This structure is better than long prose because it answers both:
- `what does this mean?`
- `what should I do now?`

---

## Exact Page Map

## 1. Help Center Home

### Purpose
Give owners fast orientation and a few obvious paths.

### Sections
- Eyebrow: `Help`
- Headline:
  - `Quick answers, honest explanations, and a direct line to the founder.`
- Intro paragraph:
  - explain that this is a practical guide, not a giant docs site

### Main modules
- `How small Talk works`
  - 4-5 step workflow card
- `Most common questions`
  - top 4-6 most-read help topics
- `Jump to a topic`
  - statuses
  - private feedback
  - reminders
  - links and QR codes
  - billing / account later
- `Message the founder`

### Best CTAs
- `Start here`
- `What "Copied" means`
- `Links and QR codes`
- `Message Jon`

---

## 2. Article: How small Talk works

### Purpose
Be the owner’s “start here” page.

### Short answer
small Talk helps customers move from a blank Google review box to a short guided flow, then drafts a review from their real inputs.

### Cover
- `How small Talk works`
- estimated read time

### Sections
- `The 5-step flow`
  - send request
  - customer rates experience
  - small Talk drafts the review
  - customer copies and goes to Google
  - low ratings can go to private feedback instead
- `What you’ll see in the dashboard`
- `What small Talk can confirm`
- `What small Talk cannot confirm`

### Common confusion
- copied is not posted
- low ratings do not automatically go public

### What to do next
- read the statuses guide
- choose between personalized and QR links

---

## 3. Article: What "Copied" actually means

### Purpose
Protect trust by being precise.

### Short answer
`Copied` means the customer copied the draft and we opened the Google handoff. It does not mean the review is live on Google.

### Sections
- `What happens right before Copied`
- `What happens after Copied`
- `Why Google may still not show a review`
- `What to check if you’re unsure`

### Common confusion
- “Copied” is the last confirmed step inside small Talk
- Google still controls the final post

### What to do next
- check Google directly if you need confirmation
- use request detail / timeline for small Talk-confirmed actions

---

## 4. Article: Low ratings, private feedback, and what happens next

### Purpose
Reduce fear and explain the path clearly.

### Short answer
For low ratings, the customer gets a real choice: post publicly or send private feedback. small Talk does not quietly block public reviews.

### Sections
- `What the customer sees`
- `What the owner sees`
- `What happens if they choose private feedback`
- `Can they still post publicly later?`
- `Why this is not review gating`

### Common confusion
- private feedback is not the same as suppressing a review
- customers still control whether they go public later

### What to do next
- check inbox
- follow up in your normal channel
- mark handled when done

---

## 5. Article: How to handle private feedback

### Purpose
Tell owners exactly what to do operationally.

### Short answer
Read the feedback, follow up through your normal communication channel, then mark it handled in small Talk.

### Sections
- `Where private feedback appears`
- `What information you get`
- `How to follow up today`
- `What "Handled" means`
- `What small Talk does not do yet`

### Common confusion
- owners do not reply inside small Talk right now
- the product organizes the problem; follow-up still happens by phone/email/text

### What to do next
- open inbox
- contact the customer
- mark handled

---

## 6. Article: Personalized links vs QR/shared links

### Purpose
Help owners choose the right request type.

### Short answer
Use personalized links when you know the customer. Use the QR/shared link when you need a reusable public entry point.

### Sections
- `What personalized links are for`
- `What generic QR/shared links are for`
- `What each one tracks`
- `What each one does not track`
- `When to use which`

### Common confusion
- generic links are reusable
- personalized links are tied to a single request
- reminders belong to personalized request flow, not generic QR use

### What to do next
- if texting or emailing someone directly, use personalized
- if printing or putting it at a counter, use QR/shared

---

## 7. Article: How reminders work

### Purpose
Explain timing and limits simply.

### Short answer
small Talk can send up to two reminder messages after the initial request. The sequence stops when the customer completes the flow or opts out.

### Sections
- `When reminders happen`
- `What stops reminders`
- `How SMS opt-out works`
- `What reminders are not`

### Common confusion
- small Talk is not nudging forever
- reminders do not guarantee completion

### What to do next
- check send/request detail if a customer has stalled

---

## 8. Article: Why a review may not appear on Google

### Purpose
Answer the “is this broken?” fear calmly.

### Short answer
Sometimes the customer drafts and copies the review but never finishes posting it on Google.

### Sections
- `What small Talk can confirm`
- `Where the handoff leaves our system`
- `Why Google may still not show the review`
- `What to do if this happens a lot`

### Common confusion
- dashboard progress is not the same as Google confirmation

### What to do next
- use clearer follow-up
- simplify owner expectations

---

## 9. Article: What to do when a customer doesn’t finish

### Purpose
Give owners a practical next-step playbook.

### Short answer
If someone opened or started but didn’t finish, don’t panic. Check the request state, let the reminder sequence do its job, and then decide whether to resend or try a different request type.

### Sections
- `Opened but didn’t start`
- `Started but didn’t finish`
- `Drafted but never copied`
- `Copied but no Google review shows`
- `When to resend`

### Common confusion
- incomplete does not always mean disinterest
- many customers finish later

### What to do next
- wait for reminder if applicable
- resend manually if needed
- consider QR or in-person flow when appropriate

---

## Most Common Questions To Put On Home

Recommended top 6:

1. `What does "Copied" actually mean?`
2. `A customer gave 2 stars — what happens now?`
3. `How do reminders work?`
4. `Should I use a personalized link or the QR code?`
5. `Why didn’t a review appear on Google?`
6. `How do I handle private feedback?`

These should be visible on the home page even before search exists.

---

## Content Voice Rules

Every help page should be:
- plain English
- operational
- calm
- honest

Avoid:
- legalistic wording unless necessary
- startup jargon
- overpromising
- pretending the product knows more than it does

Use phrases like:
- `This means...`
- `In practice...`
- `What to do next...`
- `What small Talk can confirm...`

Do not say:
- `posted on Google` unless we actually confirm it later via sync

Preferred truthful language:
- `review copied`
- `Google handoff opened`
- `private feedback received`
- `marked handled`

---

## Support Intake Tagging

The founder inbox should help improve the help center over time.

Every owner message should be mentally or formally bucketed into:
- onboarding confusion
- statuses confusion
- low-rating/private-feedback confusion
- QR/personalized link confusion
- reminders confusion
- billing
- bug
- feature request

Once the same confusion shows up repeatedly, the help center should be updated.

This is how the help center gets better from real usage instead of founder guesswork.

---

## Success Criteria

The help center is working if:
- owners can quickly understand what the product is doing
- support questions become more specific and less repetitive
- fewer owners confuse `Copied` with `Posted`
- fewer owners are surprised by the low-rating/private-feedback path
- fewer owners misuse generic links vs personalized links
- founder inbox volume shifts from basic confusion to higher-quality product feedback

---

## Recommended Next Implementation Slice

Build this first:

1. Turn `/dashboard/support` into a real `Help Center home`
2. Add article pages for:
   - `How small Talk works`
   - `What "Copied" actually means`
   - `Personalized links vs QR/shared links`
3. Keep the founder message form at the bottom of:
   - help home
   - every article page

That will give the biggest improvement fastest.
