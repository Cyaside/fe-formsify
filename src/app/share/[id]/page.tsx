"use client";

import { useParams } from "next/navigation";
import SharedFormPage from "@/features/forms/public/SharedFormPage";

export default function ShareFormRoutePage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <SharedFormPage initialFormId={formId} />;
}
