"use client";

/**
 * shadcn-style Collapsible built on React Aria's Disclosure (the project's UI
 * primitives are React Aria, not Radix). The root carries `group/collapsible`
 * and React Aria sets `data-expanded` on it, so children can style themselves
 * with `group-data-expanded/collapsible:*`.
 */
import type {
  ButtonProps as AriaButtonProps,
  DisclosurePanelProps,
  DisclosureProps,
} from "react-aria-components";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
} from "react-aria-components";
import { cx } from "@/components/uui/utils/cx";

export function Collapsible({ className, ...props }: DisclosureProps & { className?: string }) {
  return <AriaDisclosure {...props} className={cx("group/collapsible", className)} />;
}

/** A plain trigger button. Any React Aria Button with `slot="trigger"` also works. */
export function CollapsibleTrigger(props: AriaButtonProps) {
  return <AriaButton slot="trigger" {...props} />;
}

export function CollapsibleContent(props: DisclosurePanelProps) {
  return <AriaDisclosurePanel {...props} />;
}
