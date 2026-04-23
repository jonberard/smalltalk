"use client";

import Link from "next/link";
import { useState } from "react";
import { dashboardButtonClassName } from "@/components/dashboard/button";

type PreviewButtonRole = "primary" | "secondary" | "accent" | "danger";
type PreviewButtonSize = "sm" | "md" | "lg";
type ButtonStyleId = "current" | "vector" | "slab" | "editorial";
type SwitcherStyleId = "current" | "vector" | "plate" | "rail";
type ReplyFilter = "needs_reply" | "replied";

const BUTTON_STYLES: {
  id: ButtonStyleId;
  label: string;
  note: string;
}[] = [
  {
    id: "current",
    label: "A. Current tactile",
    note: "The warmer, deeper dashboard button family that now feels more physical and branded.",
  },
  {
    id: "vector",
    label: "B. Flat vector",
    note: "Cleaner and crisper. More graphic, less tactile. Good if you want the dashboard to feel sharper and flatter.",
  },
  {
    id: "slab",
    label: "C. Structured slab",
    note: "Still button-like, but with firmer edges and a heavier pressed feel instead of a glossy surface.",
  },
  {
    id: "editorial",
    label: "D. Soft editorial",
    note: "More refined and understated. Better if you want the controls to feel premium but not loud.",
  },
];

const SWITCHER_STYLES: {
  id: SwitcherStyleId;
  label: string;
  note: string;
}[] = [
  {
    id: "current",
    label: "1. Current capsule",
    note: "Closest to what you have now, just a little tidier.",
  },
  {
    id: "vector",
    label: "2. Flat segmented",
    note: "Sharper, more graphic, and more product-like.",
  },
  {
    id: "plate",
    label: "3. Raised plate",
    note: "Feels more intentional and premium without becoming too decorative.",
  },
  {
    id: "rail",
    label: "4. Rail tabs",
    note: "A stronger desktop control if you want filters to feel less pill-heavy.",
  },
];

function previewButtonClassName(
  style: ButtonStyleId,
  role: PreviewButtonRole,
  size: PreviewButtonSize = "md",
) {
  if (style === "current") {
    return dashboardButtonClassName({
      variant: role,
      size,
    });
  }

  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-center font-semibold leading-none tracking-[-0.015em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E05A3D]/12 active:translate-y-[1px]";

  const sizeClasses =
    size === "sm"
      ? "h-10 rounded-[12px] px-4 text-[12px]"
      : size === "lg"
        ? "h-12 min-w-[148px] rounded-[14px] px-5.5 text-[14px]"
        : "h-11 rounded-[13px] px-4.5 text-[13px]";

  if (style === "vector") {
    const vectorRole =
      role === "primary"
        ? "border-[#D9593B] bg-[#E05A3D] text-white shadow-none hover:border-[#C94E32] hover:bg-[#D65438]"
        : role === "accent"
          ? "border-[#F0C7B7] bg-[#FFF4ED] text-[#BC4A2F] shadow-none hover:border-[#E3B19D] hover:bg-[#FFEBDD]"
          : role === "danger"
            ? "border-[#D93636] bg-[#D93636] text-white shadow-none hover:border-[#C62828] hover:bg-[#C62828]"
            : "border-[#DDD2C3] bg-white text-[var(--dash-text)] shadow-none hover:border-[#CFC1AF] hover:bg-[#FBF7F1]";

    return `${base} ${sizeClasses} ${vectorRole}`;
  }

  if (style === "slab") {
    const slabRole =
      role === "primary"
        ? "border-[#B94B31] bg-[#E56C4D] text-white shadow-[0_3px_0_#B94B31] hover:-translate-y-[1px] hover:bg-[#E96F50] hover:shadow-[0_4px_0_#B94B31]"
        : role === "accent"
          ? "border-[#D8A18F] bg-[#FFF4EC] text-[#BC4A2F] shadow-[0_3px_0_#EBCABD] hover:-translate-y-[1px] hover:bg-[#FFF1E7] hover:shadow-[0_4px_0_#E4BFAD]"
          : role === "danger"
            ? "border-[#B72B2B] bg-[#D93F3F] text-white shadow-[0_3px_0_#B72B2B] hover:-translate-y-[1px] hover:bg-[#DD4747] hover:shadow-[0_4px_0_#B72B2B]"
            : "border-[#D8CEBF] bg-[#FFFDF9] text-[var(--dash-text)] shadow-[0_3px_0_#E6DDD1] hover:-translate-y-[1px] hover:bg-white hover:shadow-[0_4px_0_#DDD2C5]";

    return `${base} ${sizeClasses} ${slabRole}`;
  }

  const editorialRole =
    role === "primary"
      ? "border-[#D76749] bg-[linear-gradient(180deg,#F48B70_0%,#E46A4B_100%)] text-white shadow-[0_10px_24px_rgba(224,90,61,0.14)] hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(224,90,61,0.18)]"
      : role === "accent"
        ? "border-[#E7C8BC] bg-[#FFF9F6] text-[#B85137] shadow-[0_8px_18px_rgba(26,29,32,0.04)] hover:-translate-y-[1px] hover:border-[#DEB29F]"
        : role === "danger"
          ? "border-[#D74C4C] bg-[#FFF6F6] text-[#B92D2D] shadow-[0_8px_18px_rgba(26,29,32,0.04)] hover:-translate-y-[1px] hover:border-[#CC4040]"
          : "border-[#E6DDD2] bg-[#FFFCF8] text-[var(--dash-text)] shadow-[0_8px_18px_rgba(26,29,32,0.04)] hover:-translate-y-[1px] hover:border-[#D9CCBC]";

  return `${base} ${sizeClasses} ${editorialRole}`;
}

function PreviewButton({
  style,
  role,
  size = "md",
  children,
}: {
  style: ButtonStyleId;
  role: PreviewButtonRole;
  size?: PreviewButtonSize;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={previewButtonClassName(style, role, size)}>
      {children}
    </button>
  );
}

function ButtonStyleCard({
  style,
}: {
  style: (typeof BUTTON_STYLES)[number];
}) {
  return (
    <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Button Direction
          </p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
            {style.label}
          </h2>
          <p className="mt-2 max-w-[48ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            {style.note}
          </p>
        </div>
        <span className="rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-semibold text-[#BC4A2F]">
          Tell me {style.label.split(".")[0]}
        </span>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
            Page actions
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <PreviewButton style={style.id} role="secondary" size="lg">
              Help Center
            </PreviewButton>
            <PreviewButton style={style.id} role="accent" size="lg">
              Reply voice
            </PreviewButton>
            <PreviewButton style={style.id} role="primary" size="lg">
              Send request
            </PreviewButton>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
            Queue and card actions
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <PreviewButton style={style.id} role="secondary" size="sm">
              Open request
            </PreviewButton>
            <PreviewButton style={style.id} role="accent" size="sm">
              Draft reply
            </PreviewButton>
            <PreviewButton style={style.id} role="primary" size="sm">
              Mark handled
            </PreviewButton>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dash-muted)]">
            Modal footer
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <PreviewButton style={style.id} role="secondary">
              Close
            </PreviewButton>
            <PreviewButton style={style.id} role="primary">
              Copy reply
            </PreviewButton>
            <PreviewButton style={style.id} role="danger">
              Delete account
            </PreviewButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function SwitcherPreview({
  style,
}: {
  style: (typeof SWITCHER_STYLES)[number];
}) {
  const [active, setActive] = useState<ReplyFilter>("needs_reply");

  const options = [
    { key: "needs_reply" as const, label: "Needs reply", count: 14 },
    { key: "replied" as const, label: "Replied", count: 1 },
  ];

  function switcherClassName(option: (typeof options)[number]) {
    const selected = active === option.key;

    if (style.id === "current") {
      return selected
        ? "bg-white text-[var(--dash-text)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        : "text-[var(--dash-muted)]";
    }

    if (style.id === "vector") {
      return selected
        ? "border-[#D9593B] bg-[#E05A3D] text-white"
        : "border-[#E3D7C8] bg-white text-[var(--dash-muted)]";
    }

    if (style.id === "plate") {
      return selected
        ? "border-[#D7C8B7] bg-[#FFFDF9] text-[var(--dash-text)] shadow-[0_6px_14px_rgba(26,29,32,0.07)]"
        : "border-transparent bg-transparent text-[var(--dash-muted)]";
    }

    return selected
      ? "border-b-2 border-[#E05A3D] text-[var(--dash-text)]"
      : "border-b-2 border-transparent text-[var(--dash-muted)]";
  }

  function countClassName(option: (typeof options)[number]) {
    const selected = active === option.key;

    if (style.id === "current") {
      return selected
        ? "bg-[#F4EFE8] text-[var(--dash-text)]"
        : "bg-white/70 text-[var(--dash-muted)]";
    }

    if (style.id === "vector") {
      return selected
        ? "bg-white/16 text-white"
        : "bg-[#F7F1E9] text-[var(--dash-muted)]";
    }

    if (style.id === "plate") {
      return selected
        ? "bg-[#F5EEE5] text-[var(--dash-text)]"
        : "bg-[#F3EEE7] text-[var(--dash-muted)]";
    }

    return selected
      ? "bg-[#FFF1E8] text-[#BC4A2F]"
      : "bg-[#F4F0E9] text-[var(--dash-muted)]";
  }

  const wrapperClassName =
    style.id === "current"
      ? "flex gap-2 rounded-full bg-[#EFEAE2] p-1"
      : style.id === "vector"
        ? "flex gap-2 rounded-[16px] border border-[#E3D7C8] bg-[#FCF8F2] p-1.5"
        : style.id === "plate"
          ? "flex gap-2 rounded-[18px] bg-[#EEE5DA] p-1.5"
          : "flex gap-6 border-b border-[var(--dash-border)]";

  const buttonBase =
    style.id === "rail"
      ? "inline-flex items-center gap-2 border-b-2 px-0 pb-3 text-[13px] font-semibold transition-colors"
      : "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all";

  return (
    <section className="rounded-[var(--dash-radius)] border border-[var(--dash-border)] bg-white p-5 shadow-[var(--dash-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
        Switcher Direction
      </p>
      <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--dash-text)]">
        {style.label}
      </h2>
      <p className="mt-2 max-w-[48ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
        {style.note}
      </p>

      <div className="mt-5 rounded-[var(--dash-radius-sm)] border border-[var(--dash-border)] bg-[#FCFAF6] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dash-muted)]">
          Public Reply Queue
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-[34ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            These are copied public reviews that still need a thoughtful owner response or a saved record of one.
          </p>
          <div className={wrapperClassName}>
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActive(option.key)}
                className={`${buttonBase} ${switcherClassName(option)}`}
              >
                {option.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${countClassName(option)}`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminUiLabPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Founder UI Lab
          </p>
          <h1 className="mt-2 font-heading text-[36px] font-semibold leading-[0.98] tracking-tight text-[var(--dash-text)]">
            Compare button and switcher directions without guessing.
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-[var(--dash-muted)]">
            This is a private founder-only preview page. Pick the button family and switcher direction you want, and then I can apply the winner across the owner dashboard with much less churn.
          </p>
        </div>
        <Link
          href="/admin/system"
          className="inline-flex items-center rounded-[12px] border border-[var(--dash-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--dash-text)] transition-colors hover:bg-[var(--dash-bg)]"
        >
          Back to system
        </Link>
      </div>

      <div className="rounded-[var(--dash-radius)] border border-[#EBC9BD] bg-[#FFF8F4] p-5 shadow-[var(--dash-shadow)]">
        <p className="text-[12px] leading-relaxed text-[var(--dash-text)]">
          Quick way to decide:
          {" "}
          <span className="font-semibold">tell me a button letter and a switcher number.</span>
          {" "}
          Example: <span className="font-semibold">Button B + Switcher 3</span>.
        </p>
      </div>

      <section>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Buttons
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
            Four directions for owner-dashboard actions
          </h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {BUTTON_STYLES.map((style) => (
            <ButtonStyleCard key={style.id} style={style} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dash-muted)]">
            Switchers
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--dash-text)]">
            Four directions for queue filters and segmented controls
          </h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {SWITCHER_STYLES.map((style) => (
            <SwitcherPreview key={style.id} style={style} />
          ))}
        </div>
      </section>
    </div>
  );
}
