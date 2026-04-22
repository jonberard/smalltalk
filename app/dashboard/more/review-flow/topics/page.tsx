"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SetupPageShell } from "@/components/dashboard/setup-shell";
import { TopicRow, TopicSection } from "@/components/dashboard/setup-sections";

export default function ReviewFlowTopicsPage() {
  const { business } = useAuth();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [isCustomized, setIsCustomized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    const businessId = business.id;

    async function fetchTopics() {
      const topicRes = await supabase
        .from("topics")
        .select("*")
        .or(`business_id.eq.${businessId},business_id.is.null`)
        .order("sort_order");

      const allTopics = (topicRes.data || []) as TopicRow[];
      const customTopics = allTopics.filter((topic) => topic.business_id === businessId);

      if (customTopics.length > 0) {
        setTopics(customTopics);
        setIsCustomized(true);
      } else {
        setTopics(allTopics.filter((topic) => topic.business_id === null));
        setIsCustomized(false);
      }

      setLoading(false);
    }

    void fetchTopics();
  }, [business]);

  if (!business) return null;

  return (
    <SetupPageShell
      eyebrow="Setup / Review Flow / Topics"
      title="Tune what customers are asked about."
      description="These prompts shape the substance of every review draft. Keep them broad enough to fit real service work, but specific enough to create honest, useful detail."
      backHref="/dashboard/more/review-flow"
      backLabel="Back to review flow"
      headerTone="detail"
    >
      {loading ? (
        <div className="h-[420px] animate-pulse rounded-[var(--dash-radius)] bg-[var(--dash-border)]" />
      ) : (
        <TopicSection topics={topics} businessId={business.id} isCustomized={isCustomized} />
      )}
    </SetupPageShell>
  );
}
