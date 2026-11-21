import type { ComponentType } from "react";
import type { LandingProps } from "../default-landing";

/**
 * Custom designs, by landing slug. The media buyer creates a landing in
 * Admin > Landings (title + slug) and it shows DefaultLanding. When the
 * owner designs it, add a component file in this folder and map its slug
 * here; the page switches to it with no other change.
 *
 * Example:
 *   import { NavidadAndorra } from "./navidad-andorra";
 *   export const DESIGNS = { "navidad-andorra": NavidadAndorra };
 */
export const DESIGNS: Record<string, ComponentType<LandingProps>> = {};
