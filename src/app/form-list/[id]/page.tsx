"use client";

import { useParams } from "next/navigation";
import PublicFormDetailPage from "@/features/forms/public/PublicFormDetailPage";

export default function PublicFormDetailRoutePage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <PublicFormDetailPage initialFormId={formId} />;
}
