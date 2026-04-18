import { IndustryPage } from "@/components/industry/industry-page";
import { contractorsData } from "@/lib/industries/contractors";
import { createIndustryMetadata } from "@/lib/industries/metadata";

export const metadata = createIndustryMetadata(contractorsData);

export default function Page() {
  return <IndustryPage data={contractorsData} />;
}
