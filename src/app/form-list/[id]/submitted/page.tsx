"use client";

import { useParams } from "next/navigation";
import SubmissionThankYouPage from "@/features/forms/public/SubmissionThankYouPage";

export default function Page() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <SubmissionThankYouPage initialFormId={formId} />;
}
