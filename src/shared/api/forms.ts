import { apiRequest } from "@/shared/api/client";

export type QuestionType = "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";

export type QuestionOption = {
  id: string;
  label: string;
  order: number;
};

export type Section = {
  id: string;
  formId: string;
  title: string;
  description?: string | null;
  order: number;
};

export type Question = {
  id: string;
  sectionId: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  required: boolean;
  order: number;
  options: QuestionOption[];
};

export type FormOwner = {
  id: string;
  email: string;
  name?: string | null;
};

export type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean;
  owner?: FormOwner | null;
};

export type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  owner?: FormOwner | null;
};

export type ResponseAnswer = {
  id: string;
  questionId: string;
  optionId?: string | null;
  text?: string | null;
  question: {
    id: string;
    title: string;
    type: QuestionType;
    options: Array<{ id: string; label: string }>;
  };
};

export type ResponseRecord = {
  id: string;
  formId: string;
  createdAt: string;
  answers: ResponseAnswer[];
};

export type ResponsesPayload = {
  data: ResponseRecord[];
  form: {
    id: string;
    title: string;
    description?: string | null;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ResponseDetailPayload = {
  data: ResponseRecord;
  form: {
    id: string;
    title: string;
    description?: string | null;
  };
};

export type CreateFormPayload = {
  title: string;
  description?: string | null;
  thankYouTitle?: string;
  thankYouMessage?: string;
  isPublished?: boolean;
};

export type UpdateFormPayload = {
  title?: string;
  description?: string | null;
  thankYouTitle?: string;
  thankYouMessage?: string;
  isPublished?: boolean;
};

export type CreateQuestionPayload = {
  title: string;
  description?: string | null;
  type: QuestionType;
  required?: boolean;
  order?: number;
  options?: string[];
  sectionId?: string;
};

export type UpdateQuestionPayload = {
  title?: string;
  description?: string | null;
  type?: QuestionType;
  required?: boolean;
  order?: number;
  options?: string[];
  sectionId?: string;
};

export type CreateSectionPayload = {
  title: string;
  description?: string | null;
  order?: number;
};

export type UpdateSectionPayload = {
  title?: string;
  description?: string | null;
  order?: number;
};

export type SubmitAnswer = {
  questionId: string;
  optionId?: string;
  text?: string;
};

export type SubmitPayload = {
  answers: SubmitAnswer[];
};

export type FormsListParams = {
  search?: string;
  status?: "all" | "draft" | "published";
  sort?: "newest" | "oldest";
};

export type ResponsesListParams = {
  page?: number;
  limit?: number;
};

type RequestOptions = {
  showGlobalLoading?: boolean;
};

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const formsApi = {
  list: (params?: FormsListParams) =>
    apiRequest<{ data: FormSummary[] }>(`/api/forms${buildQuery(params)}`),
  listPublic: (params?: { page?: number; limit?: number }) =>
    apiRequest<{ data: FormSummary[] }>(`/api/forms/public${buildQuery(params)}`),
  detail: (formId: string) =>
    apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
  questions: (formId: string) =>
    apiRequest<{ data: Question[] }>(`/api/forms/${formId}/questions`),
  sections: (formId: string) =>
    apiRequest<{ data: Section[] }>(`/api/forms/${formId}/sections`),
  create: (payload: CreateFormPayload, options?: RequestOptions) =>
    apiRequest<{ data: { id: string } }>("/api/forms", {
      method: "POST",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  createSection: (
    formId: string,
    payload: CreateSectionPayload,
    options?: RequestOptions,
  ) =>
    apiRequest<{ data: Section }>(`/api/forms/${formId}/sections`, {
      method: "POST",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  updateSection: (
    sectionId: string,
    payload: UpdateSectionPayload,
    options?: RequestOptions,
  ) =>
    apiRequest<{ data: Section }>(`/api/sections/${sectionId}`, {
      method: "PUT",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  removeSection: (sectionId: string, options?: RequestOptions) =>
    apiRequest(`/api/sections/${sectionId}`, {
      method: "DELETE",
      showGlobalLoading: options?.showGlobalLoading,
    }),
  update: (formId: string, payload: UpdateFormPayload, options?: RequestOptions) =>
    apiRequest(`/api/forms/${formId}`, {
      method: "PUT",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  remove: (formId: string, options?: RequestOptions) =>
    apiRequest(`/api/forms/${formId}`, {
      method: "DELETE",
      showGlobalLoading: options?.showGlobalLoading,
    }),
  createQuestion: (
    formId: string,
    payload: CreateQuestionPayload,
    options?: RequestOptions,
  ) =>
    apiRequest<{ data: { id: string } }>(`/api/forms/${formId}/questions`, {
      method: "POST",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  updateQuestion: (
    questionId: string,
    payload: UpdateQuestionPayload,
    options?: RequestOptions,
  ) =>
    apiRequest(`/api/questions/${questionId}`, {
      method: "PUT",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  removeQuestion: (questionId: string, options?: RequestOptions) =>
    apiRequest(`/api/questions/${questionId}`, {
      method: "DELETE",
      showGlobalLoading: options?.showGlobalLoading,
    }),
  submit: (
    formId: string,
    payload: SubmitPayload,
    options?: { showGlobalLoading?: boolean },
  ) =>
    apiRequest(`/api/forms/${formId}/submit`, {
      method: "POST",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  responses: (formId: string, params?: ResponsesListParams) =>
    apiRequest<ResponsesPayload>(`/api/forms/${formId}/responses${buildQuery(params)}`),
  responseDetail: (formId: string, responseId: string) =>
    apiRequest<ResponseDetailPayload>(`/api/forms/${formId}/responses/${responseId}`),
  deleteResponse: (formId: string, responseId: string) =>
    apiRequest(`/api/forms/${formId}/responses/${responseId}`, {
      method: "DELETE",
    }),
};
