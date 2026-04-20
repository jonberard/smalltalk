import { notFound } from "next/navigation";
import CreateTestLinkClient from "@/components/admin/create-test-link-client";

export default function CreateTestLinkPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return <CreateTestLinkClient />;
}
