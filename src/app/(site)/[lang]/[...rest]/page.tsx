import { notFound } from "next/navigation";

/** Any path with no page behind it: the [lang] 404 page, with a real 404 status. */
export default function UnknownPage() {
  notFound();
}
