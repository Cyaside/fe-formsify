"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { createCollabSocket, type CollabSocket } from "./client";
import {
  COLLAB_EVENTS,
  type CollabEditingTarget,
  type CollabErrorPayload,
  type CollabJoinedPayload,
  type CollabOpAppliedPayload,
  type CollabOpPayload,
  type CollabOpRejectedPayload,
  type CollabParticipant,
  type CollabRole,
  type CollabStatusPayload,
  type CollabSyncPayload,
} from "./types";

type UseFormCollaborationParams = {
  enabled: boolean;
  formId: string | null;
  authToken?: string | null;
};

type UseFormCollaborationResult = {
  enabled: boolean;
  connected: boolean;
  connecting: boolean;
  joined: boolean;
  role: CollabRole | null;
  version: number | null;
  participants: CollabParticipant[];
  lastError: CollabErrorPayload | null;
  latestOpAppliedEvent:
    | {
        sequence: number;
        payload: CollabOpAppliedPayload;
      }
    | null;
  lastOpRejected: CollabOpRejectedPayload | null;
  latestStatusEvent:
    | {
        sequence: number;
        payload: CollabStatusPayload;
      }
    | null;
  latestSnapshotEvent:
    | {
        source: "joined" | "sync";
        sequence: number;
        payload: CollabJoinedPayload | CollabSyncPayload;
      }
    | null;
  sendPresenceUpdate: (editingTarget: CollabEditingTarget) => void;
  requestSync: () => void;
  sendOp: (op: CollabOpPayload) => void;
  setKnownVersion: (version: number) => void;
};

type CollabState = Omit<
  UseFormCollaborationResult,
  "enabled" | "sendPresenceUpdate" | "requestSync" | "sendOp" | "setKnownVersion"
>;

const initialCollabState: CollabState = {
  connected: false,
  connecting: false,
  joined: false,
  role: null,
  version: null,
  participants: [],
  lastError: null,
  latestOpAppliedEvent: null,
  lastOpRejected: null,
  latestStatusEvent: null,
  latestSnapshotEvent: null,
};

type CollabAction =
  | { type: "reset-ephemeral" }
  | { type: "reset-disabled" }
  | { type: "connecting"; value: boolean }
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "reset-join-state" }
  | { type: "set-error"; payload: CollabErrorPayload | null }
  | { type: "join-ack-failed"; payload: CollabErrorPayload }
  | {
      type: "join-ack-ok";
      payload: {
        formId: string;
        role: CollabRole;
        version: number;
      };
    }
  | {
      type: "joined-event";
      payload: {
        version: number;
        participants: CollabParticipant[];
        event: NonNullable<CollabState["latestSnapshotEvent"]>;
      };
    }
  | { type: "presence"; participants: CollabParticipant[] }
  | {
      type: "sync";
      payload: {
        version: number;
        event: NonNullable<CollabState["latestSnapshotEvent"]>;
      };
    }
  | {
      type: "op-applied";
      payload: {
        version: number;
        event: NonNullable<CollabState["latestOpAppliedEvent"]>;
      };
    }
  | {
      type: "op-rejected";
      payload: CollabOpRejectedPayload;
    }
  | {
      type: "status";
      payload: {
        event: NonNullable<CollabState["latestStatusEvent"]>;
        latestVersion?: number | null;
      };
    }
  | { type: "set-known-version"; version: number };

const resetJoinState = (state: CollabState): CollabState => ({
  ...state,
  joined: false,
  role: null,
  participants: [],
  latestOpAppliedEvent: null,
  latestStatusEvent: null,
  latestSnapshotEvent: null,
});

const collabReducer = (state: CollabState, action: CollabAction): CollabState => {
  switch (action.type) {
    case "reset-ephemeral":
      return {
        ...state,
        lastError: null,
        latestOpAppliedEvent: null,
        lastOpRejected: null,
        latestStatusEvent: null,
      };

    case "reset-disabled":
      return {
        ...initialCollabState,
      };

    case "connecting":
      return {
        ...state,
        connecting: action.value,
      };

    case "connected":
      return {
        ...state,
        connected: true,
        connecting: false,
      };

    case "disconnected":
      return {
        ...resetJoinState(state),
        connected: false,
        connecting: false,
      };

    case "reset-join-state":
      return resetJoinState(state);

    case "set-error":
      return {
        ...state,
        lastError: action.payload,
      };

    case "join-ack-failed":
      return {
        ...resetJoinState(state),
        lastError: action.payload,
      };

    case "join-ack-ok":
      return {
        ...state,
        joined: true,
        role: action.payload.role,
        version: action.payload.version,
      };

    case "joined-event":
      return {
        ...state,
        joined: true,
        version: action.payload.version,
        participants: action.payload.participants,
        latestSnapshotEvent: action.payload.event,
      };

    case "presence":
      return {
        ...state,
        participants: action.participants,
      };

    case "sync":
      return {
        ...state,
        version: action.payload.version,
        latestSnapshotEvent: action.payload.event,
      };

    case "op-applied":
      return {
        ...state,
        version: action.payload.version,
        latestOpAppliedEvent: action.payload.event,
      };

    case "op-rejected":
      return {
        ...state,
        lastOpRejected: action.payload,
        version: action.payload.latestVersion,
      };

    case "status":
      return {
        ...state,
        version:
          typeof action.payload.latestVersion === "number"
            ? action.payload.latestVersion
            : state.version,
        latestStatusEvent: action.payload.event,
      };

    case "set-known-version":
      return {
        ...state,
        version: action.version,
      };

    default:
      return state;
  }
};

export function useFormCollaboration({
  enabled,
  formId,
  authToken,
}: UseFormCollaborationParams): UseFormCollaborationResult {
  const socketRef = useRef<CollabSocket | null>(null);
  const joinedFormIdRef = useRef<string | null>(null);
  const [state, dispatch] = useReducer(collabReducer, initialCollabState);

  const snapshotSequenceRef = useRef(0);
  const opAppliedSequenceRef = useRef(0);
  const statusSequenceRef = useRef(0);

  useEffect(() => {
    dispatch({ type: "reset-ephemeral" });
  }, [formId, enabled]);

  useEffect(() => {
    if (!enabled || !formId) {
      const socket = socketRef.current;
      socketRef.current = null;
      joinedFormIdRef.current = null;
      dispatch({ type: "reset-disabled" });
      if (socket) {
        socket.disconnect();
      }
      return;
    }

    const socket = createCollabSocket(authToken);
    socketRef.current = socket;
    dispatch({ type: "connecting", value: true });

    const resetJoinedStateOnly = () => {
      joinedFormIdRef.current = null;
      dispatch({ type: "reset-join-state" });
    };

    const joinForm = () => {
      socket.emit(COLLAB_EVENTS.join, { formId }, (ack) => {
        if (!ack.ok) {
          dispatch({
            type: "join-ack-failed",
            payload: {
              message: ack.message,
              code: ack.status === 403 ? "FORBIDDEN" : "UNKNOWN",
            },
          });
          resetJoinedStateOnly();
          return;
        }

        joinedFormIdRef.current = ack.formId;
        dispatch({
          type: "join-ack-ok",
          payload: {
            formId: ack.formId,
            role: ack.role,
            version: ack.version,
          },
        });
        socket.emit(COLLAB_EVENTS.syncRequest, { formId: ack.formId });
      });
    };

    socket.on("connect", () => {
      dispatch({ type: "connected" });
      joinForm();
    });

    socket.on("disconnect", () => {
      dispatch({ type: "disconnected" });
    });

    socket.on(COLLAB_EVENTS.error, (payload) => {
      dispatch({ type: "set-error", payload });
    });

    socket.on(COLLAB_EVENTS.joined, (payload) => {
      if (payload.formId !== formId) return;
      snapshotSequenceRef.current += 1;
      dispatch({
        type: "joined-event",
        payload: {
          version: payload.version,
          participants: payload.participants,
          event: {
            source: "joined",
            sequence: snapshotSequenceRef.current,
            payload,
          },
        },
      });
    });

    socket.on(COLLAB_EVENTS.presence, (payload) => {
      if (payload.formId !== formId) return;
      dispatch({ type: "presence", participants: payload.participants });
    });

    socket.on(COLLAB_EVENTS.sync, (payload) => {
      if (payload.formId !== formId) return;
      snapshotSequenceRef.current += 1;
      dispatch({
        type: "sync",
        payload: {
          version: payload.version,
          event: {
            source: "sync",
            sequence: snapshotSequenceRef.current,
            payload,
          },
        },
      });
    });

    socket.on(COLLAB_EVENTS.opApplied, (payload) => {
      if (payload.formId !== formId) return;
      opAppliedSequenceRef.current += 1;
      dispatch({
        type: "op-applied",
        payload: {
          version: payload.nextVersion,
          event: {
            sequence: opAppliedSequenceRef.current,
            payload,
          },
        },
      });
    });

    socket.on(COLLAB_EVENTS.opRejected, (payload) => {
      if (payload.formId !== formId) return;
      dispatch({ type: "op-rejected", payload });
    });

    socket.on(COLLAB_EVENTS.status, (payload) => {
      if (payload.formId !== formId) return;
      statusSequenceRef.current += 1;
      dispatch({
        type: "status",
        payload: {
          latestVersion:
            Number.isInteger(payload.latestVersion) && (payload.latestVersion as number) >= 0
              ? (payload.latestVersion as number)
              : null,
          event: {
            sequence: statusSequenceRef.current,
            payload,
          },
        },
      });
    });

    socket.connect();

    return () => {
      if (socket.connected && joinedFormIdRef.current) {
        socket.emit(COLLAB_EVENTS.leave, { formId: joinedFormIdRef.current });
      }
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      joinedFormIdRef.current = null;
    };
  }, [authToken, enabled, formId]);

  const actions = useMemo(
    () => ({
      sendPresenceUpdate: (editingTarget: CollabEditingTarget) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected || !formId || joinedFormIdRef.current !== formId) {
          return;
        }
        socket.emit(COLLAB_EVENTS.presenceUpdate, { formId, editingTarget });
      },
      requestSync: () => {
        const socket = socketRef.current;
        if (!socket || !socket.connected || !formId || joinedFormIdRef.current !== formId) {
          return;
        }
        socket.emit(COLLAB_EVENTS.syncRequest, { formId });
      },
      sendOp: (op: CollabOpPayload) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected || !formId || joinedFormIdRef.current !== formId) {
          return;
        }
        socket.emit(COLLAB_EVENTS.op, op);
      },
      setKnownVersion: (nextVersion: number) => {
        if (!Number.isInteger(nextVersion) || nextVersion < 0) return;
        dispatch({ type: "set-known-version", version: nextVersion });
      },
    }),
    [formId],
  );

  return useMemo(
    () => ({
      enabled,
      connected: state.connected,
      connecting: state.connecting,
      joined: state.joined,
      role: state.role,
      version: state.version,
      participants: state.participants,
      lastError: state.lastError,
      latestOpAppliedEvent: state.latestOpAppliedEvent,
      lastOpRejected: state.lastOpRejected,
      latestStatusEvent: state.latestStatusEvent,
      latestSnapshotEvent: state.latestSnapshotEvent,
      sendPresenceUpdate: actions.sendPresenceUpdate,
      requestSync: actions.requestSync,
      sendOp: actions.sendOp,
      setKnownVersion: actions.setKnownVersion,
    }),
    [actions, enabled, state],
  );
}
