import { IndustryPage } from "@/components/industry/industry-page";
import { createIndustryMetadata } from "@/lib/industries/metadata";
import { poolCompaniesData } from "@/lib/industries/pool-companies";

export const metadata = createIndustryMetadata(poolCompaniesData);

export default function Page() {
  return <IndustryPage data={poolCompaniesData} />;
}
