"use client";

/**
 * Empty state built with the Untitled UI EmptyState (MIT, © 2025 Untitled UI,
 * vendored in src/components/uui): circle background pattern behind an
 * original Tripcelona illustration, title, supporting text and actions.
 */
import type { ReactNode } from "react";
import { EmptyState as UuiEmptyState } from "@/components/uui/application/empty-state/empty-state";
import { ILLUSTRATIONS, type IllustrationName } from "./illustrations";

export function EmptyState({
  illustration = "route",
  title,
  children,
  action,
}: {
  illustration?: IllustrationName;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const Art = ILLUSTRATIONS[illustration];
  return (
    <UuiEmptyState size="md" className="py-8">
      <UuiEmptyState.Header pattern="circle" patternSize="md">
        <Art className="relative z-10 h-24 w-auto" />
      </UuiEmptyState.Header>
      <UuiEmptyState.Content className="mb-4!">
        {title && <p className="text-lg font-semibold text-primary">{title}</p>}
        <UuiEmptyState.Description>{children}</UuiEmptyState.Description>
      </UuiEmptyState.Content>
      {action && <UuiEmptyState.Footer>{action}</UuiEmptyState.Footer>}
    </UuiEmptyState>
  );
}
