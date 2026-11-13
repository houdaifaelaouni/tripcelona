"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localizePath } from "@/lib/i18n/config";
import { useLocale } from "./provider";

type Props = ComponentProps<typeof NextLink>;

/** next/link that keeps the visitor's language: "/blog" becomes "/en/blog" on the English site. */
export default function Link({ href, ...rest }: Props) {
  const locale = useLocale();
  const to =
    typeof href === "string"
      ? localizePath(href, locale)
      : href.pathname
        ? { ...href, pathname: localizePath(href.pathname, locale) }
        : href;
  return <NextLink href={to} {...rest} />;
}
