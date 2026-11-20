import { Node, mergeAttributes } from "@tiptap/react";

/**
 * Editor side of the "routeMap" rich-text node. The admin editor cannot draw
 * or edit the map yet; this keeps the node (title + stops) intact when a
 * description that has one is edited and saved, and shows a placeholder.
 */
export const RouteMapNode = Node.create({
  name: "routeMap",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      title: { default: null },
      points: { default: [] },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-route-map]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const points = (node.attrs.points as { name: string }[]) ?? [];
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-route-map": "",
        class: "rounded-lg border border-dashed border-primary bg-secondary px-3 py-2 text-sm",
      }),
      `🗺️ Mapa de la ruta: ${points.map((p) => p.name).join(" → ") || "sin paradas"}`,
    ];
  },
});
