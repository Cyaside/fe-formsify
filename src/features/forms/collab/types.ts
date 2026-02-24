export const COLLAB_EVENTS = {
  ready: "collab:ready",
  error: "collab:error",
  join: "collab:join",
  leave: "collab:leave",
  joined: "collab:joined",
  presenceUpdate: "collab:presence:update",
  presence: "collab:presence",
  op: "collab:op",
  opApplied: "collab:op:applied",
  opRejected: "collab:op:rejected",
  syncRequest: "collab:sync:request",
  sync: "collab:sync",
} as const;

export type CollabRole = "OWNER" | "EDITOR" | "VIEWER" | "NONE";

export type CollabEditingTarget =
  | null
  | {
      kind: "form" | "section" | "question" | "option";
      id?: string;
      field?: string;
    };

export type CollabParticipant = {
  socketId: string;
  user: {
    id: string;
    email: string;
  };
  role: CollabRole;
  editingTarget: CollabEditingTarget;
  joinedAt: string;
  lastSeenAt: string;
};

export type CollabJoinPayload = {
  formId: string;
};

export type CollabJoinAck =
  | {
      ok: true;
      formId: string;
      role: CollabRole;
      version: number;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

export type CollabJoinedPayload = {
  formId: string;
  version: number;
  snapshot: null;
  participants: CollabParticipant[];
};

export type CollabPresenceUpdatePayload = {
  formId: string;
  editingTarget: CollabEditingTarget;
};

export type CollabPresencePayload = {
  formId: string;
  participants: CollabParticipant[];
};

export type CollabOpPayload = {
  formId: string;
  opId: string;
  baseVersion: number;
  type: string;
  payload: unknown;
};

export type CollabOpAppliedPayload = {
  formId: string;
  opId: string;
  nextVersion: number;
  op: CollabOpPayload;
  actor: {
    id: string;
    email: string;
  };
};

export type CollabOpRejectedPayload = {
  formId: string;
  opId: string;
  reason: string;
  latestVersion: number;
};

export type CollabSyncRequestPayload = {
  formId: string;
};

export type CollabSyncPayload = {
  formId: string;
  version: number;
  snapshot: null;
};

export type CollabReadyPayload = {
  user: {
    id: string;
    email: string;
  };
};

export type CollabErrorPayload = {
  message: string;
  code:
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "INVALID_PAYLOAD"
    | "NOT_IMPLEMENTED"
    | "CONFLICT"
    | "UNKNOWN";
};

