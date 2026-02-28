"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/shared/api/client";
import type {
  CollabClientToServerEvents,
  CollabServerToClientEvents,
} from "./types";

export type CollabSocket = Socket<CollabServerToClientEvents, CollabClientToServerEvents>;

export const createCollabSocket = (token?: string | null) =>
  io(API_BASE_URL, {
    path: "/socket.io",
    autoConnect: false,
    withCredentials: true,
    auth:
      typeof token === "string" && token.trim().length > 0
        ? { token: token.trim() }
        : undefined,
  }) as CollabSocket;

