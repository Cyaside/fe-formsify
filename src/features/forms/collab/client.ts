"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/shared/api/client";
import type {
  CollabClientToServerEvents,
  CollabServerToClientEvents,
} from "./types";

export type CollabSocket = Socket<CollabServerToClientEvents, CollabClientToServerEvents>;

export const createCollabSocket = () =>
  io(API_BASE_URL, {
    path: "/socket.io",
    autoConnect: false,
    withCredentials: true,
  }) as CollabSocket;

