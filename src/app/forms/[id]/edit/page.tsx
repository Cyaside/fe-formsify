"use client";

import { useParams } from "next/navigation";
import FormBuilderPage from "@/features/forms/builder/FormBuilderPage";

export default function EditFormPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <FormBuilderPage initialFormId={formId} />;
}
