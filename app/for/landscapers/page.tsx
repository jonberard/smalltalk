import { IndustryPage } from "@/components/industry/industry-page";
import { landscapersData } from "@/lib/industries/landscapers";
import { createIndustryMetadata } from "@/lib/industries/metadata";

export const metadata = createIndustryMetadata(landscapersData);

export default function Page() {
  return <IndustryPage data={landscapersData} />;
}
