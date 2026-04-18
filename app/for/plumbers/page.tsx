import { IndustryPage } from "@/components/industry/industry-page";
import { createIndustryMetadata } from "@/lib/industries/metadata";
import { plumbersData } from "@/lib/industries/plumbers";

export const metadata = createIndustryMetadata(plumbersData);

export default function Page() {
  return <IndustryPage data={plumbersData} />;
}
