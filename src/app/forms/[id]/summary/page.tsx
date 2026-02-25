"use client";

import { useParams } from "next/navigation";
import FormSummaryPage from "@/features/forms/summary/FormSummaryPage";

export default function Page() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <FormSummaryPage initialFormId={formId} />;
}
