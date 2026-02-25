"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export function useFormCollaboration({
  enabled,
  formId,
}: UseFormCollaborationParams): UseFormCollaborationResult {
  const socketRef = useRef<CollabSocket | null>(null);
  const joinedFormIdRef = useRef<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [role, setRole] = useState<CollabRole | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [participants, setParticipants] = useState<CollabParticipant[]>([]);
  const [lastError, setLastError] = useState<CollabErrorPayload | null>(null);
  const [latestOpAppliedEvent, setLatestOpAppliedEvent] =
    useState<UseFormCollaborationResult["latestOpAppliedEvent"]>(null);
  const [lastOpRejected, setLastOpRejected] = useState<CollabOpRejectedPayload | null>(null);
  const [latestStatusEvent, setLatestStatusEvent] =
    useState<UseFormCollaborationResult["latestStatusEvent"]>(null);
  const [latestSnapshotEvent, setLatestSnapshotEvent] = useState<UseFormCollaborationResult["latestSnapshotEvent"]>(null);
  const snapshotSequenceRef = useRef(0);
  const opAppliedSequenceRef = useRef(0);
  const statusSequenceRef = useRef(0);

  useEffect(() => {
    setLastError(null);
    setLatestOpAppliedEvent(null);
    setLastOpRejected(null);
    setLatestStatusEvent(null);
  }, [formId, enabled]);

  useEffect(() => {
    if (!enabled || !formId) {
      const socket = socketRef.current;
      socketRef.current = null;
      joinedFormIdRef.current = null;
      setConnecting(false);
      setConnected(false);
      setJoined(false);
      setRole(null);
      setVersion(null);
      setParticipants([]);
      setLatestOpAppliedEvent(null);
      setLatestStatusEvent(null);
      setLatestSnapshotEvent(null);
      if (socket) {
        socket.disconnect();
      }
      return;
    }

    const socket = createCollabSocket();
    socketRef.current = socket;
    setConnecting(true);

    const resetJoinState = () => {
      joinedFormIdRef.current = null;
      setJoined(false);
      setRole(null);
      setParticipants([]);
      setLatestOpAppliedEvent(null);
      setLatestStatusEvent(null);
      setLatestSnapshotEvent(null);
    };

    const joinForm = () => {
      socket.emit(COLLAB_EVENTS.join, { formId }, (ack) => {
        if (!ack.ok) {
          setLastError({
            message: ack.message,
            code: ack.status === 403 ? "FORBIDDEN" : "UNKNOWN",
          });
          resetJoinState();
          return;
        }

        joinedFormIdRef.current = ack.formId;
        setJoined(true);
        setRole(ack.role);
        setVersion(ack.version);
        socket.emit(COLLAB_EVENTS.syncRequest, { formId: ack.formId });
      });
    };

    socket.on("connect", () => {
      setConnected(true);
      setConnecting(false);
      joinForm();
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setConnecting(false);
      resetJoinState();
    });

    socket.on(COLLAB_EVENTS.error, (payload) => {
      setLastError(payload);
    });

    socket.on(COLLAB_EVENTS.joined, (payload) => {
      if (payload.formId !== formId) return;
      setVersion(payload.version);
      setParticipants(payload.participants);
      setJoined(true);
      snapshotSequenceRef.current += 1;
      setLatestSnapshotEvent({
        source: "joined",
        sequence: snapshotSequenceRef.current,
        payload,
      });
    });

    socket.on(COLLAB_EVENTS.presence, (payload) => {
      if (payload.formId !== formId) return;
      setParticipants(payload.participants);
    });

    socket.on(COLLAB_EVENTS.sync, (payload) => {
      if (payload.formId !== formId) return;
      setVersion(payload.version);
      snapshotSequenceRef.current += 1;
      setLatestSnapshotEvent({
        source: "sync",
        sequence: snapshotSequenceRef.current,
        payload,
      });
    });

    socket.on(COLLAB_EVENTS.opApplied, (payload) => {
      if (payload.formId !== formId) return;
      setVersion(payload.nextVersion);
      opAppliedSequenceRef.current += 1;
      setLatestOpAppliedEvent({
        sequence: opAppliedSequenceRef.current,
        payload,
      });
    });

    socket.on(COLLAB_EVENTS.opRejected, (payload) => {
      if (payload.formId !== formId) return;
      setLastOpRejected(payload);
      setVersion(payload.latestVersion);
    });

    socket.on(COLLAB_EVENTS.status, (payload) => {
      if (payload.formId !== formId) return;
      if (Number.isInteger(payload.latestVersion) && (payload.latestVersion as number) >= 0) {
        setVersion(payload.latestVersion as number);
      }
      statusSequenceRef.current += 1;
      setLatestStatusEvent({
        sequence: statusSequenceRef.current,
        payload,
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
  }, [enabled, formId]);

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
        setVersion(nextVersion);
      },
    }),
    [formId],
  );

  return {
    enabled,
    connected,
    connecting,
    joined,
    role,
    version,
    participants,
    lastError,
    latestOpAppliedEvent,
    lastOpRejected,
    latestStatusEvent,
    latestSnapshotEvent,
    sendPresenceUpdate: actions.sendPresenceUpdate,
    requestSync: actions.requestSync,
    sendOp: actions.sendOp,
    setKnownVersion: actions.setKnownVersion,
  };
}
