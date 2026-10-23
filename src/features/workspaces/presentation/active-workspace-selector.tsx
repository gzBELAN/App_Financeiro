"use client";

import { useState, useTransition } from "react";

import { selectWorkspace } from "@/features/workspaces/application/workspace-actions";
import type { Workspace } from "@/features/workspaces/domain/workspace";

const roleLabel: Record<Workspace["role"], string> = { editor: "Editor", owner: "Proprietário", viewer: "Visualizador" };

export function ActiveWorkspaceSelector({ activeWorkspaceId, workspaces }: { activeWorkspaceId: string; workspaces: Workspace[] }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!workspaces.length) return null;

  function change(workspaceId: string) {
    startTransition(async () => {
      const result = await selectWorkspace(workspaceId);
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  return <div className="min-w-0 sm:ml-auto"><label className="grid min-w-0 gap-1 text-sm font-medium text-muted-foreground" htmlFor="active-workspace">Controle financeiro<select aria-describedby={feedback ? "workspace-feedback" : undefined} className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-foreground disabled:opacity-60 sm:w-64" defaultValue={activeWorkspaceId} disabled={isPending} id="active-workspace" onChange={(event) => change(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {roleLabel[workspace.role]}</option>)}</select></label>{feedback ? <p aria-live="polite" className="mt-1 text-xs text-muted-foreground" id="workspace-feedback">{feedback}</p> : null}</div>;
}
