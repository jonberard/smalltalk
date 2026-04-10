"use client";

/* ═══════════════════════════════════════════════════
   GOOGLE REVIEW HANDOFF MOCKUP
   Animated loop: empty form → tap → paste → stars → post → success
   Pure CSS @keyframes, 10s cycle, seamless loop.

   TIMELINE (10s = 100%):
   Phase 1: 0.0–1.5s  ( 0–15%)  Empty form visible, idle
   Phase 2: 1.5–2.0s  (15–20%)  Cursor appears, moves to text field
   Phase 3: 2.0–2.3s  (20–23%)  Cursor taps text field, focus border
   Phase 4: 2.3–2.8s  (23–28%)  Paste tooltip appears, pause
   Phase 5: 2.8–3.1s  (28–31%)  Cursor taps Paste
   Phase 6: 3.1–4.6s  (31–46%)  Review text appears instantly, hold to read
   Phase 7: 4.6–5.1s  (46–51%)  Cursor moves to 5th star
   Phase 8: 5.1–5.9s  (51–59%)  Stars cascade fill L→R, hold filled
   Phase 9: 5.9–6.3s  (59–63%)  Cursor moves to Post button
   Phase10: 6.3–6.6s  (63–66%)  Post button press
   Phase11: 6.6–7.6s  (66–76%)  Checkmark appears, hold
   Phase12: 7.6–8.1s  (76���81%)  Fade to empty
   Phase13: 8.1–10.0s (81–100%) Hold empty, seamless loop
   ═══════════════════════════════════════════════════ */

export default function GoogleReviewMockup({
  businessName = "Crystal Clear Pools",
  reviewText,
}: {
  businessName?: string;
  reviewText?: string;
}) {
  const defaultReview = "Pool looks crystal clear. Highly recommend.";
  const raw = reviewText && reviewText.trim() ? reviewText.trim() : defaultReview;
  // Shorten to ~80 chars for the mockup display
  const shortReview = raw.length > 80 ? raw.slice(0, 77) + "..." : raw;

  const initials = businessName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ maxWidth: 320, margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Phone frame */}
      <div className="grm-phone">
        <div className="grm-island" />
        <div className="grm-screen">
          <div className="grm-overlay" />

          {/* Google card */}
          <div className="grm-card">
            {/* Header */}
            <div className="grm-header">
              <div className="grm-biz-row">
                <div className="grm-avatar">{initials}</div>
                <div>
                  <div className="grm-biz-name">{businessName}</div>
                  <div className="grm-biz-addr">Austin, TX</div>
                </div>
              </div>
              <div className="grm-post-btn">
                <span className="grm-post-label">Post</span>
                <div className="grm-post-overlay" />
              </div>
            </div>

            {/* Stars */}
            <div className="grm-stars">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grm-star">
                  <svg viewBox="0 0 24 24" width="32" height="32">
                    <path
                      d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l7.1-1.01L12 2z"
                      fill="none"
                      stroke="#DADCE0"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg className={`grm-star-fill grm-star-fill-${i}`} viewBox="0 0 24 24" width="32" height="32">
                    <path
                      d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l7.1-1.01L12 2z"
                      fill="#FBBC04"
                    />
                  </svg>
                </div>
              ))}
            </div>

            {/* Text area */}
            <div className="grm-textarea">
              <span className="grm-placeholder">Share details of your own experience at this place</span>
              <span className="grm-pasted-text">{shortReview}</span>
              <div className="grm-paste-bubble">Paste</div>
            </div>

            {/* Success */}
            <div className="grm-success">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="#34A853" />
                <path className="grm-check" d="M14 24l7 7 13-13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Cursor */}
          <div className="grm-cursor" />
        </div>
        <div className="grm-home-bar" />
      </div>

      <style>{`
        /* ═══ PHONE ═══ */
        .grm-phone {
          position: relative;
          border-radius: 40px;
          border: 1px solid #D5D5D5;
          background: #F0F0F0;
          padding: 3px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
        .grm-island {
          position: absolute; top: 4px; left: 50%; transform: translateX(-50%);
          width: 40px; height: 11px; border-radius: 99px; background: #000; z-index: 30;
        }
        .grm-screen {
          position: relative; border-radius: 37px; overflow: hidden;
          background: #E8EAED; aspect-ratio: 9/17;
          display: flex; align-items: center; justify-content: center;
        }
        .grm-home-bar {
          margin: 2px auto 0; width: 70px; height: 3px;
          border-radius: 99px; background: rgba(0,0,0,0.15);
        }
        .grm-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.3); z-index: 1;
        }

        /* ═══ CARD ═══ */
        .grm-card {
          position: relative; z-index: 2; background: #fff;
          border-radius: 12px; width: 88%; padding: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          animation: grm-cardFade 10s ease infinite;
        }

        /* ═══ HEADER ═══ */
        .grm-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .grm-biz-row { display: flex; align-items: center; gap: 10px; }
        .grm-avatar {
          width: 32px; height: 32px; border-radius: 50%; background: #E8EAED;
          color: #5F6368; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .grm-biz-name { font-size: 14px; font-weight: 600; color: #202124; line-height: 1.2; }
        .grm-biz-addr { font-size: 11px; color: #70757A; margin-top: 1px; }

        /* ═══ POST BTN ═══ */
        .grm-post-btn {
          position: relative; background: #1A73E8; border-radius: 99px;
          padding: 6px 16px; flex-shrink: 0; overflow: hidden;
        }
        .grm-post-label { position: relative; z-index: 1; color: #fff; font-size: 12px; font-weight: 600; }
        .grm-post-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.18);
          opacity: 0; animation: grm-postPress 10s ease infinite;
        }

        /* ═══ STARS ═══ */
        .grm-stars { display: flex; justify-content: center; gap: 4px; margin-bottom: 14px; }
        .grm-star { position: relative; width: 32px; height: 32px; }
        .grm-star svg:first-child { position: relative; }
        .grm-star-fill {
          position: absolute; top: 0; left: 0;
          opacity: 0; transform: scale(0.6);
        }
        /* Stars cascade at 53-55% with 80ms stagger */
        .grm-star-fill-1 { animation: grm-starPop 10s ease infinite; animation-delay: 0s; }
        .grm-star-fill-2 { animation: grm-starPop 10s ease infinite; animation-delay: 0.08s; }
        .grm-star-fill-3 { animation: grm-starPop 10s ease infinite; animation-delay: 0.16s; }
        .grm-star-fill-4 { animation: grm-starPop 10s ease infinite; animation-delay: 0.24s; }
        .grm-star-fill-5 { animation: grm-starPop 10s ease infinite; animation-delay: 0.32s; }

        /* ═══ TEXTAREA ═══ */
        .grm-textarea {
          position: relative; border: 1.5px solid #DADCE0; border-radius: 8px;
          min-height: 72px; padding: 10px; font-size: 12px; line-height: 1.5; color: #202124;
          animation: grm-textBorder 10s ease infinite;
        }

        .grm-placeholder {
          color: #9AA0A6; font-size: 12px;
          position: absolute; top: 10px; left: 10px; right: 10px;
          pointer-events: none;
          animation: grm-placeholder 10s step-end infinite;
        }

        .grm-pasted-text {
          opacity: 0;
          animation: grm-pasteText 10s step-end infinite;
        }

        /* ═══ PASTE BUBBLE ═══ */
        .grm-paste-bubble {
          position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
          background: #2D2D2D; color: #fff; font-size: 11px; font-weight: 500;
          padding: 4px 12px; border-radius: 6px;
          opacity: 0; pointer-events: none;
          animation: grm-pasteBubble 10s ease infinite;
        }
        .grm-paste-bubble::after {
          content: ''; position: absolute; bottom: -4px; left: 50%;
          width: 8px; height: 8px; background: #2D2D2D;
          transform: translateX(-50%) rotate(45deg);
        }

        /* ═══ SUCCESS ═══ */
        .grm-success {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.93); border-radius: 12px;
          opacity: 0; pointer-events: none;
          animation: grm-success 10s ease infinite;
        }
        .grm-check {
          stroke-dasharray: 40; stroke-dashoffset: 40;
          animation: grm-checkDraw 10s ease infinite;
        }

        /* ═══ CURSOR ═══ */
        .grm-cursor {
          position: absolute; width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0, 0, 0, 0.35);
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          z-index: 10; pointer-events: none;
          opacity: 0;
          animation: grm-cursorPos 10s cubic-bezier(0.4, 0, 0.2, 1) infinite, grm-cursorVis 10s ease infinite;
        }

        /* ═══════════════════════════════════════════
           KEYFRAMES — 10s cycle
           ═══════════════════════════════════════════

           ABSOLUTE TIMES → PERCENTAGES:
           0.0s =  0%    1.5s = 15%    2.0s = 20%    2.3s = 23%
           2.8s = 28%    3.1s = 31%    4.6s = 46%    5.1s = 51%
           5.5s = 55%    5.9s = 59%    6.3s = 63%    6.6s = 66%
           7.6s = 76%    8.1s = 81%   10.0s = 100%
           ═══════════════════════════════════════════ */

        /* CURSOR POSITION — ease-in-out via cubic-bezier on the animation */
        @keyframes grm-cursorPos {
          /* Phase 1: offscreen below card */
          0%, 15% {
            top: 85%; left: 65%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 2: arrive at textarea center (20%) */
          20% {
            top: 67%; left: 50%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 3: tap textarea (20.5%) */
          20.5% {
            top: 67%; left: 50%;
            transform: translate(-50%, -50%) scale(0.7);
          }
          21.5% {
            top: 67%; left: 50%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 4: move up to paste bubble center (28%) */
          27% {
            top: 58.5%; left: 50%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 5: tap paste (28.5%) */
          28.5% {
            top: 58.5%; left: 50%;
            transform: translate(-50%, -50%) scale(0.7);
          }
          29.5% {
            top: 58.5%; left: 50%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 6: hold while text appears, then move */
          45% {
            top: 58.5%; left: 50%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 7: move to 5th star center (51%) */
          51% {
            top: 45.5%; left: 65%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 8: tap star (52%) */
          52% {
            top: 45.5%; left: 65%;
            transform: translate(-50%, -50%) scale(0.7);
          }
          53% {
            top: 45.5%; left: 65%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Hold while stars fill */
          58% {
            top: 45.5%; left: 65%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 9: move to Post button center (63%) */
          63% {
            top: 27.5%; left: 82%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Phase 10: tap post (64%) */
          64% {
            top: 27.5%; left: 82%;
            transform: translate(-50%, -50%) scale(0.7);
          }
          65% {
            top: 27.5%; left: 82%;
            transform: translate(-50%, -50%) scale(1);
          }
          /* Hold then fade out */
          100% {
            top: 27.5%; left: 82%;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* CURSOR VISIBILITY */
        @keyframes grm-cursorVis {
          0%, 15%  { opacity: 0; }
          18%      { opacity: 1; }
          66%      { opacity: 1; }
          68%      { opacity: 0; }
          100%     { opacity: 0; }
        }

        /* TEXTAREA BORDER — focus on tap at 21% */
        @keyframes grm-textBorder {
          0%, 20%  { border-color: #DADCE0; }
          21%      { border-color: #1A73E8; }
          76%      { border-color: #1A73E8; }
          79%, 100% { border-color: #DADCE0; }
        }

        /* PLACEHOLDER — hidden once cursor taps textarea */
        @keyframes grm-placeholder {
          0%   { opacity: 1; }
          20%  { opacity: 1; }
          21%  { opacity: 0; }
          79%  { opacity: 0; }
          80%  { opacity: 1; }
          100% { opacity: 1; }
        }

        /* PASTE BUBBLE — appears 23-30% */
        @keyframes grm-pasteBubble {
          0%, 22%  { opacity: 0; transform: translateX(-50%) scale(0.85); }
          24%      { opacity: 1; transform: translateX(-50%) scale(1); }
          29%      { opacity: 1; transform: translateX(-50%) scale(1); }
          31%      { opacity: 0; transform: translateX(-50%) scale(0.85); }
          100%     { opacity: 0; }
        }

        /* PASTED TEXT — appears instantly at 31%, gone at 78% */
        @keyframes grm-pasteText {
          0%   { opacity: 0; }
          30%  { opacity: 0; }
          31%  { opacity: 1; }
          77%  { opacity: 1; }
          78%  { opacity: 0; }
          100% { opacity: 0; }
        }

        /* STARS — cascade fill starting at 53% */
        @keyframes grm-starPop {
          0%, 52%   { opacity: 0; transform: scale(0.6); }
          54%       { opacity: 1; transform: scale(1.15); }
          56%, 76%  { opacity: 1; transform: scale(1); }
          79%, 100% { opacity: 0; transform: scale(0.6); }
        }

        /* POST PRESS — at 64% */
        @keyframes grm-postPress {
          0%, 63%  { opacity: 0; }
          64%      { opacity: 1; }
          66%      { opacity: 0; }
          100%     { opacity: 0; }
        }

        /* SUCCESS — 66-76% */
        @keyframes grm-success {
          0%, 65%   { opacity: 0; }
          68%       { opacity: 1; }
          75%       { opacity: 1; }
          78%, 100% { opacity: 0; }
        }

        /* CHECK DRAW */
        @keyframes grm-checkDraw {
          0%, 67%  { stroke-dashoffset: 40; }
          72%      { stroke-dashoffset: 0; }
          100%     { stroke-dashoffset: 0; }
        }

        /* CARD FADE — reset at end */
        @keyframes grm-cardFade {
          0%, 5%   { opacity: 1; }
          77%      { opacity: 1; }
          80%      { opacity: 0; }
          84%      { opacity: 0; }
          87%      { opacity: 1; }
          100%     { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
