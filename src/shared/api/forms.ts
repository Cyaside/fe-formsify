import { apiRequest } from "@/shared/api/client";

export type QuestionType =
  | "SHORT_ANSWER"
  | "PARAGRAPH"
  | "MCQ"
  | "CHECKBOX"
  | "DROPDOWN";

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
  isClosed?: boolean;
  responseLimit?: number | null;
  owner?: FormOwner | null;
};

export type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
  isPublished?: boolean;
  isClosed?: boolean;
  responseLimit?: number | null;
  responseCount?: number;
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
  isClosed?: boolean;
  responseLimit?: number | null;
};

export type UpdateFormPayload = {
  title?: string;
  description?: string | null;
  thankYouTitle?: string;
  thankYouMessage?: string;
  isPublished?: boolean;
  isClosed?: boolean;
  responseLimit?: number | null;
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

export type BuilderSnapshotSection = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
};

export type BuilderSnapshotQuestion = {
  id: string;
  sectionId: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  required: boolean;
  order: number;
  options: string[];
};

export type BuilderSnapshot = {
  title: string;
  description?: string | null;
  thankYouTitle: string;
  thankYouMessage: string;
  isClosed: boolean;
  responseLimit: number | null;
  sections: BuilderSnapshotSection[];
  questions: BuilderSnapshotQuestion[];
};

export type BuilderSnapshotResponse = {
  data: {
    formId: string;
    version: number;
    snapshot: BuilderSnapshot;
  };
};

export type BuilderBootstrapResponse = {
  data: {
    form: FormDetail;
    sections: Section[];
    questions: Question[];
    role: "OWNER" | "EDITOR";
  };
};

export type UpdateBuilderSnapshotPayload = {
  baseVersion: number;
  snapshot: BuilderSnapshot;
};

export type CollaboratorRole = "OWNER" | "EDITOR";

export type CollaboratorUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type FormCollaborator = {
  formId: string;
  userId: string;
  role: "EDITOR";
  createdAt: string;
  updatedAt: string;
  user: CollaboratorUser;
};

export type FormOwnerCollaborator = {
  userId: string;
  role: "OWNER";
  user: CollaboratorUser;
};

export type FormCollaboratorsResponse = {
  owner: FormOwnerCollaborator | null;
  data: FormCollaborator[];
};

export type CreateCollaboratorPayload =
  | {
      email: string;
      role: "EDITOR";
    }
  | {
      userId: string;
      role: "EDITOR";
    };

export type UpdateCollaboratorPayload = {
  role: "EDITOR";
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
  listCollaborations: (params?: FormsListParams) =>
    apiRequest<{ data: FormSummary[] }>(`/api/forms/collaborations${buildQuery(params)}`),
  listPublic: (params?: { page?: number; limit?: number }) =>
    apiRequest<{ data: FormSummary[] }>(`/api/forms/public${buildQuery(params)}`),
  detail: (formId: string) =>
    apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
  builderBootstrap: (formId: string) =>
    apiRequest<BuilderBootstrapResponse>(`/api/forms/${formId}/builder-bootstrap`),
  questions: (formId: string) =>
    apiRequest<{ data: Question[] }>(`/api/forms/${formId}/questions`),
  sections: (formId: string) =>
    apiRequest<{ data: Section[] }>(`/api/forms/${formId}/sections`),
  builderSnapshot: (formId: string) =>
    apiRequest<BuilderSnapshotResponse>(`/api/forms/${formId}/builder-snapshot`),
  collaborators: (formId: string) =>
    apiRequest<FormCollaboratorsResponse>(`/api/forms/${formId}/collaborators`),
  addCollaborator: (
    formId: string,
    payload: CreateCollaboratorPayload,
    options?: RequestOptions,
  ) =>
    apiRequest<{ data: FormCollaborator }>(`/api/forms/${formId}/collaborators`, {
      method: "POST",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  updateCollaborator: (
    formId: string,
    userId: string,
    payload: UpdateCollaboratorPayload,
    options?: RequestOptions,
  ) =>
    apiRequest<{ data: FormCollaborator }>(`/api/forms/${formId}/collaborators/${userId}`, {
      method: "PATCH",
      body: payload,
      showGlobalLoading: options?.showGlobalLoading,
    }),
  removeCollaborator: (formId: string, userId: string, options?: RequestOptions) =>
    apiRequest(`/api/forms/${formId}/collaborators/${userId}`, {
      method: "DELETE",
      showGlobalLoading: options?.showGlobalLoading,
    }),
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
  updateBuilderSnapshot: (
    formId: string,
    payload: UpdateBuilderSnapshotPayload,
    options?: RequestOptions,
  ) =>
    apiRequest<BuilderSnapshotResponse>(`/api/forms/${formId}/builder-snapshot`, {
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
