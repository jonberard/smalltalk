"use client";

/* ═══════════════════════════════════════════════════
   GOOGLE REVIEW HANDOFF MOCKUP
   Animated loop: empty form → tap → paste → stars → post → success
   Pure CSS @keyframes, 5s cycle, seamless loop.

   TIMELINE (5s = 100%):
   Step 1: 0-1s   (0-20%)   Empty form, idle
   Step 2: 1-1.5s (20-30%)  Cursor appears, moves to textarea, taps, focus border
   Step 3: 1.5-2s (30-40%)  Paste tooltip appears, cursor taps it
   Step 4: 2-3s   (40-60%)  Text appears instantly (paste), tooltip gone
   Step 5: 3-3.5s (60-70%)  Cursor to stars, tap, stars fill cascade
   Step 6: 3.5-4s (70-80%)  Cursor to Post, tap, press animation
   Step 7: 4-4.5s (80-90%)  Success checkmark
   Step 8: 4.5-5s (90-100%) Fade out, reset to empty
   ═══════════════════════════════════════════════════ */

export default function GoogleReviewMockup({
  businessName = "Crystal Clear Pools",
  reviewText = "Marcus was fantastic. Pool looks crystal clear. Highly recommend.",
}: {
  businessName?: string;
  reviewText?: string;
}) {
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
              <span className="grm-pasted-text">{reviewText}</span>
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
          animation: grm-cardFade 5s ease infinite;
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
          opacity: 0; animation: grm-postPress 5s ease infinite;
        }

        /* ═══ STARS ═══ */
        .grm-stars { display: flex; justify-content: center; gap: 4px; margin-bottom: 14px; }
        .grm-star { position: relative; width: 32px; height: 32px; }
        .grm-star svg:first-child { position: relative; }
        .grm-star-fill {
          position: absolute; top: 0; left: 0;
          opacity: 0; transform: scale(0.6);
        }
        /* Stagger: stars fill at 62-64% (3.1-3.2s) */
        .grm-star-fill-1 { animation: grm-starPop 5s ease infinite; animation-delay: 0s; }
        .grm-star-fill-2 { animation: grm-starPop 5s ease infinite; animation-delay: 0.04s; }
        .grm-star-fill-3 { animation: grm-starPop 5s ease infinite; animation-delay: 0.08s; }
        .grm-star-fill-4 { animation: grm-starPop 5s ease infinite; animation-delay: 0.12s; }
        .grm-star-fill-5 { animation: grm-starPop 5s ease infinite; animation-delay: 0.16s; }

        /* ═══ TEXTAREA ═══ */
        .grm-textarea {
          position: relative; border: 1.5px solid #DADCE0; border-radius: 8px;
          min-height: 72px; padding: 10px; font-size: 12px; line-height: 1.5; color: #202124;
          animation: grm-textBorder 5s ease infinite;
        }

        /* Placeholder: visible 0-25%, hidden 25-92%, visible 94-100% */
        .grm-placeholder {
          color: #9AA0A6; font-size: 12px;
          position: absolute; top: 10px; left: 10px; right: 10px;
          pointer-events: none;
          animation: grm-placeholder 5s step-end infinite;
        }

        /* Pasted text: hidden 0-40%, visible 40-90%, hidden 92-100% */
        .grm-pasted-text {
          opacity: 0;
          animation: grm-pasteText 5s step-end infinite;
        }

        /* ═══ PASTE BUBBLE ═══ */
        .grm-paste-bubble {
          position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
          background: #2D2D2D; color: #fff; font-size: 11px; font-weight: 500;
          padding: 4px 12px; border-radius: 6px;
          opacity: 0; pointer-events: none;
          animation: grm-pasteBubble 5s ease infinite;
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
          animation: grm-success 5s ease infinite;
        }
        .grm-check {
          stroke-dasharray: 40; stroke-dashoffset: 40;
          animation: grm-checkDraw 5s ease infinite;
        }

        /* ═══ CURSOR ═══ */
        .grm-cursor {
          position: absolute; width: 24px; height: 24px; border-radius: 50%;
          background: rgba(32,33,36,0.4); box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          z-index: 10; pointer-events: none;
          opacity: 0;
          animation: grm-cursorPos 5s ease-in-out infinite, grm-cursorVis 5s ease infinite;
        }

        /* ═══════════════════════════════════════════
           KEYFRAMES — 5s cycle
           0%=0s  20%=1s  30%=1.5s  40%=2s
           60%=3s  70%=3.5s  80%=4s  90%=4.5s
           ═══════════════════════════════════════════ */

        /* CURSOR POSITION + TAP SCALE */
        @keyframes grm-cursorPos {
          /* Step 1: offscreen */
          0%, 18% {
            top: 80%; left: 60%;
          }
          /* Step 2: move to textarea center (1-1.3s) */
          24% {
            top: 68%; left: 50%;
          }
          /* Step 2: tap textarea (1.3s) */
          26% {
            top: 68%; left: 50%; transform: translate(-50%,-50%) scale(0.75);
          }
          28% {
            top: 68%; left: 50%; transform: translate(-50%,-50%) scale(1);
          }
          /* Step 3: hold at textarea for paste tooltip */
          30% {
            top: 68%; left: 50%; transform: translate(-50%,-50%);
          }
          /* Step 3: tap paste (1.7s = 34%) */
          34% {
            top: 60%; left: 50%; transform: translate(-50%,-50%);
          }
          35% {
            top: 60%; left: 50%; transform: translate(-50%,-50%) scale(0.75);
          }
          37% {
            top: 60%; left: 50%; transform: translate(-50%,-50%) scale(1);
          }
          /* Step 4: hold while text pastes */
          55% {
            top: 60%; left: 50%; transform: translate(-50%,-50%);
          }
          /* Step 5: move to star 5 (3s = 60%) */
          62% {
            top: 46%; left: 66%; transform: translate(-50%,-50%);
          }
          /* Tap star */
          63% {
            top: 46%; left: 66%; transform: translate(-50%,-50%) scale(0.75);
          }
          65% {
            top: 46%; left: 66%; transform: translate(-50%,-50%) scale(1);
          }
          /* Step 6: move to Post button (3.5s = 70%) */
          72% {
            top: 28%; left: 82%; transform: translate(-50%,-50%);
          }
          /* Tap Post */
          74% {
            top: 28%; left: 82%; transform: translate(-50%,-50%) scale(0.75);
          }
          76% {
            top: 28%; left: 82%; transform: translate(-50%,-50%) scale(1);
          }
          /* Hold */
          100% {
            top: 28%; left: 82%; transform: translate(-50%,-50%);
          }
        }

        /* CURSOR VISIBILITY */
        @keyframes grm-cursorVis {
          0%, 19%  { opacity: 0; }
          22%      { opacity: 1; }
          77%      { opacity: 1; }
          80%      { opacity: 0; }
          100%     { opacity: 0; }
        }

        /* TEXTAREA BORDER — focus at step 2 tap */
        @keyframes grm-textBorder {
          0%, 25%  { border-color: #DADCE0; }
          27%      { border-color: #1A73E8; }
          88%      { border-color: #1A73E8; }
          92%,100% { border-color: #DADCE0; }
        }

        /* PLACEHOLDER — visible until cursor taps textarea */
        @keyframes grm-placeholder {
          0%   { opacity: 1; }
          26%  { opacity: 1; }
          27%  { opacity: 0; }
          92%  { opacity: 0; }
          93%  { opacity: 1; }
          100% { opacity: 1; }
        }

        /* PASTE BUBBLE — appears 30-38% (1.5-1.9s) */
        @keyframes grm-pasteBubble {
          0%, 29%  { opacity: 0; transform: translateX(-50%) scale(0.85); }
          31%      { opacity: 1; transform: translateX(-50%) scale(1); }
          37%      { opacity: 1; transform: translateX(-50%) scale(1); }
          39%      { opacity: 0; transform: translateX(-50%) scale(0.85); }
          100%     { opacity: 0; }
        }

        /* PASTED TEXT — appears instantly at 40% (2s), gone at 92% */
        @keyframes grm-pasteText {
          0%   { opacity: 0; }
          39%  { opacity: 0; }
          40%  { opacity: 1; }
          91%  { opacity: 1; }
          92%  { opacity: 0; }
          100% { opacity: 0; }
        }

        /* STARS — fill at 63% (3.15s), cascade via animation-delay */
        @keyframes grm-starPop {
          0%, 62%   { opacity: 0; transform: scale(0.6); }
          64%       { opacity: 1; transform: scale(1.2); }
          66%, 90%  { opacity: 1; transform: scale(1); }
          93%, 100% { opacity: 0; transform: scale(0.6); }
        }

        /* POST PRESS — at 74% (3.7s) */
        @keyframes grm-postPress {
          0%, 73%  { opacity: 0; }
          74%      { opacity: 1; }
          77%      { opacity: 0; }
          100%     { opacity: 0; }
        }

        /* SUCCESS — 80-90% (4-4.5s) */
        @keyframes grm-success {
          0%, 79%   { opacity: 0; }
          82%       { opacity: 1; }
          89%       { opacity: 1; }
          92%, 100% { opacity: 0; }
        }

        /* CHECK DRAW */
        @keyframes grm-checkDraw {
          0%, 81%  { stroke-dashoffset: 40; }
          86%      { stroke-dashoffset: 0; }
          100%     { stroke-dashoffset: 0; }
        }

        /* CARD FADE — reset at end */
        @keyframes grm-cardFade {
          0%, 3%   { opacity: 1; }
          91%      { opacity: 1; }
          94%      { opacity: 0; }
          98%      { opacity: 0; }
          100%     { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
