type BuilderCollabRolloutGuard = {
  collabFlagEnabled: boolean;
  useLegacyBuilderFlow: boolean;
  reason: "disabled_by_flag" | "collab_runtime_not_ready";
};

const parseBooleanEnv = (value: string | undefined) => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  return ["1", "true", "yes", "on"].includes(normalized);
};

export const FORM_COLLAB_ROLLOUT_ENABLED = parseBooleanEnv(
  process.env.NEXT_PUBLIC_ENABLE_FORM_COLLAB,
);

export const getBuilderCollabRolloutGuard = (): BuilderCollabRolloutGuard => {
  if (!FORM_COLLAB_ROLLOUT_ENABLED) {
    return {
      collabFlagEnabled: false,
      useLegacyBuilderFlow: true,
      reason: "disabled_by_flag",
    };
  }

  // Guardrail rollout: flag can be turned on safely before the realtime runtime ships.
  return {
    collabFlagEnabled: true,
    useLegacyBuilderFlow: true,
    reason: "collab_runtime_not_ready",
  };
};
