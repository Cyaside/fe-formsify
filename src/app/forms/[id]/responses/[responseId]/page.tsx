"use client";

import { useParams } from "next/navigation";
import FormResponseDetailPage from "@/features/forms/responses/FormResponseDetailPage";

export default function Page() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const responseId = Array.isArray(params?.responseId) ? params.responseId[0] : params?.responseId;

  return <FormResponseDetailPage initialFormId={formId} initialResponseId={responseId} />;
}
