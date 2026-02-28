"use client";

import { useParams } from "next/navigation";
import FormPreviewPage from "@/features/forms/public/FormPreviewPage";

export default function Page() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <FormPreviewPage initialFormId={formId} />;
}
