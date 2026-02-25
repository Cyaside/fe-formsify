import type { BuilderSnapshot } from "@/shared/api/forms";

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
  status: "collab:status",
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
  snapshot: BuilderSnapshot | null;
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

export type CollabStatusPayload = {
  formId: string;
  kind: "RESPONSES_LOCKED" | "RESYNC_REQUIRED";
  message: string;
  latestVersion: number | null;
};

export type CollabSyncRequestPayload = {
  formId: string;
};

export type CollabSyncPayload = {
  formId: string;
  version: number;
  snapshot: BuilderSnapshot | null;
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

export interface CollabServerToClientEvents {
  [COLLAB_EVENTS.ready]: (payload: CollabReadyPayload) => void;
  [COLLAB_EVENTS.error]: (payload: CollabErrorPayload) => void;
  [COLLAB_EVENTS.joined]: (payload: CollabJoinedPayload) => void;
  [COLLAB_EVENTS.presence]: (payload: CollabPresencePayload) => void;
  [COLLAB_EVENTS.opApplied]: (payload: CollabOpAppliedPayload) => void;
  [COLLAB_EVENTS.opRejected]: (payload: CollabOpRejectedPayload) => void;
  [COLLAB_EVENTS.status]: (payload: CollabStatusPayload) => void;
  [COLLAB_EVENTS.sync]: (payload: CollabSyncPayload) => void;
}

export interface CollabClientToServerEvents {
  [COLLAB_EVENTS.join]: (
    payload: CollabJoinPayload,
    ack?: (response: CollabJoinAck) => void,
  ) => void;
  [COLLAB_EVENTS.leave]: (payload: CollabJoinPayload) => void;
  [COLLAB_EVENTS.presenceUpdate]: (payload: CollabPresenceUpdatePayload) => void;
  [COLLAB_EVENTS.op]: (payload: CollabOpPayload) => void;
  [COLLAB_EVENTS.syncRequest]: (payload: CollabSyncRequestPayload) => void;
}
