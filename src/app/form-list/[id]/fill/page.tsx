"use client";

import { useParams } from "next/navigation";
import PublicFillFormPage from "@/features/forms/public/PublicFillFormPage";

export default function PublicFillFormRoutePage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <PublicFillFormPage initialFormId={formId} />;
}
