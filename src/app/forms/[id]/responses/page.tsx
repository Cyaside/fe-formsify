"use client";

import { useParams } from "next/navigation";
import FormResponsesPage from "@/features/forms/responses/FormResponsesPage";

export default function Page() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <FormResponsesPage initialFormId={formId} />;
}
