import { IndustryPage } from "@/components/industry/industry-page";
import { hvacData } from "@/lib/industries/hvac";
import { createIndustryMetadata } from "@/lib/industries/metadata";

export const metadata = createIndustryMetadata(hvacData);

export default function Page() {
  return <IndustryPage data={hvacData} />;
}
