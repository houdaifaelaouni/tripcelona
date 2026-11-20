"use client";

/**
 * Empty state built with the Untitled UI EmptyState (MIT, © 2025 Untitled UI,
 * vendored in src/components/uui): circle background pattern behind an
 * animated Tripcelona illustration, title, supporting text and actions.
 */
import type { ReactNode } from "react";
import { EmptyState as UuiEmptyState } from "@/components/uui/application/empty-state/empty-state";
import { Illustration } from "@/components/illustrations/illustration";
import { ADMIN_SCENES, type IllustrationName } from "./illustrations";

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
  return (
    <UuiEmptyState size="md" className="py-8">
      <UuiEmptyState.Header pattern="circle" patternSize="md">
        <Illustration
          name={ADMIN_SCENES[illustration]}
          className="relative z-10 aspect-[4/3] h-32"
        />
      </UuiEmptyState.Header>
      <UuiEmptyState.Content className="mb-4!">
        {title && <p className="text-lg font-semibold text-primary">{title}</p>}
        <UuiEmptyState.Description>{children}</UuiEmptyState.Description>
      </UuiEmptyState.Content>
      {action && <UuiEmptyState.Footer>{action}</UuiEmptyState.Footer>}
    </UuiEmptyState>
  );
}
