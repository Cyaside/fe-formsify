"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Trash2, UserPlus } from "lucide-react";
import { ApiError } from "@/shared/api/client";
import {
  formsApi,
  type FormCollaborator,
  type FormOwnerCollaborator,
} from "@/shared/api/forms";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";

type CollaboratorManagerCardProps = Readonly<{
  enabled: boolean;
  formId: string | null;
}>;

type AccessState = "idle" | "allowed" | "forbidden" | "unsupported";

type SaveState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

const DEFAULT_SAVE_STATE: SaveState = {
  loading: false,
  message: null,
  error: null,
};

function UserLine({
  email,
  name,
  role,
}: Readonly<{ email: string; name?: string | null; role: "OWNER" | "EDITOR" }>) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-ink">{name?.trim() || email}</div>
      <div className="truncate text-xs text-ink-muted">{email}</div>
      <div className="mt-1">
        <Badge variant="muted">{role}</Badge>
      </div>
    </div>
  );
}

export default function CollaboratorManagerCard({
  enabled,
  formId,
}: CollaboratorManagerCardProps) {
  const [accessState, setAccessState] = useState<AccessState>("idle");
  const [owner, setOwner] = useState<FormOwnerCollaborator | null>(null);
  const [collaborators, setCollaborators] = useState<FormCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [email, setEmail] = useState("");
  const [pendingRowUserId, setPendingRowUserId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>(DEFAULT_SAVE_STATE);

  useEffect(() => {
    if (!enabled || !formId) {
      setAccessState("idle");
      setOwner(null);
      setCollaborators([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setSaveState((prev) => ({ ...prev, error: null }));
      try {
        const response = await formsApi.collaborators(formId);
        if (cancelled) return;
        setAccessState("allowed");
        setOwner(response.owner);
        setCollaborators(response.data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setAccessState("forbidden");
          setOwner(null);
          setCollaborators([]);
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setAccessState("unsupported");
          setOwner(null);
          setCollaborators([]);
          return;
        }
        setSaveState({
          loading: false,
          message: null,
          error: error instanceof Error ? error.message : "Failed to load collaborators",
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, formId, refreshTick]);

  const refresh = () => {
    setRefreshTick((value) => value + 1);
  };

  const handleAdd = async () => {
    if (!formId) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setSaveState({ loading: false, message: null, error: "Collaborator email is required" });
      return;
    }

    setSaveState({ loading: true, message: null, error: null });
    try {
      const response = await formsApi.addCollaborator(
        formId,
        { email: normalizedEmail, role: "EDITOR" },
        { showGlobalLoading: false },
      );
      setCollaborators((prev) =>
        [...prev, response.data].sort((a, b) => a.user.email.localeCompare(b.user.email)),
      );
      setEmail("");
      setSaveState({
        loading: false,
        message: `Collaborator ${response.data.user.email} added`,
        error: null,
      });
    } catch (error) {
      setSaveState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Failed to add collaborator",
      });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!formId) return;
    setPendingRowUserId(userId);
    setSaveState((prev) => ({ ...prev, error: null, message: null }));
    try {
      await formsApi.removeCollaborator(formId, userId);
      setCollaborators((prev) => prev.filter((item) => item.userId !== userId));
      setSaveState({
        loading: false,
        message: "Collaborator removed",
        error: null,
      });
    } catch (error) {
      setSaveState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Failed to remove collaborator",
      });
    } finally {
      setPendingRowUserId(null);
    }
  };

  if (!enabled) return null;

  return (
    <Card className="mb-4 border-t-4 border-t-sky-500/70 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">Collaborators</h2>
          <p className="text-xs text-ink-muted">
            Manage owner/editor access for this form.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={refresh}
          disabled={!formId || loading || saveState.loading || pendingRowUserId !== null}
        >
          <RefreshCcw size={14} />
          Refresh
        </Button>
      </div>

      {!formId ? (
        <div className="mt-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-muted">
          Save the form first before managing collaborators.
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3 text-sm text-ink-muted">Loading collaborators...</div>
      ) : null}

      {accessState === "forbidden" ? (
        <div className="mt-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-muted">
          Only the owner can manage collaborators.
        </div>
      ) : null}

      {accessState === "unsupported" ? (
        <div className="mt-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-muted">
          Collaborator endpoint is not available yet (check backend feature flag).
        </div>
      ) : null}

      {saveState.error ? (
        <div className="mt-3 rounded-xl border border-rose/40 bg-rose/10 px-3 py-2 text-sm text-rose">
          {saveState.error}
        </div>
      ) : null}
      {saveState.message ? (
        <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-sm text-ink">
          {saveState.message}
        </div>
      ) : null}

      {accessState === "allowed" ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
              Owner
            </p>
            {owner ? (
              <div className="rounded-xl border border-border bg-surface-2 px-3 py-3">
                <UserLine email={owner.user.email} name={owner.user.name} role="OWNER" />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                Owner data tidak ditemukan.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
              Add Collaborator
            </p>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={saveState.loading || pendingRowUserId !== null}
              />
                <Button
                  className="gap-1.5"
                  onClick={handleAdd}
                  disabled={!email.trim() || saveState.loading || pendingRowUserId !== null}
                >
                  <UserPlus size={14} />
                  Add
                </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
              Daftar Collaborator
            </p>
            {collaborators.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                No collaborators yet.
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((item) => {
                  const rowPending = pendingRowUserId === item.userId;
                  return (
                    <div
                      key={item.userId}
                      className="grid gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                    >
                      <UserLine email={item.user.email} name={item.user.name} role={item.role} />
                      <div className="flex items-center text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
                        Editor
                      </div>
                        <Button
                          variant="danger"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => void handleRemove(item.userId)}
                          disabled={rowPending || saveState.loading}
                        >
                          <Trash2 size={14} />
                          Remove
                        </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
