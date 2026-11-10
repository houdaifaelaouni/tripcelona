import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Blog: ideas y guías para excursiones desde Barcelona",
  description:
    "Guías de destinos, consejos y qué llevar en tus excursiones de un día desde Barcelona.",
  alternates: { canonical: "/blog" },
};

const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });

export default async function BlogIndex() {
  const posts = await getPublishedPosts();
  return (
    <div className="container-site py-8 md:py-12">
      <h1 className="text-3xl">Blog</h1>
      {posts.length === 0 ? (
        <p className="mt-4 text-muted">Pronto publicaremos nuevas guías.</p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="overflow-hidden rounded-card border border-border bg-white shadow-card"
            >
              <Link href={`/blog/${p.slug}`} className="group block h-full">
                {p.cover && (
                  <div className="relative aspect-[16/10] bg-surface-alt">
                    <Image
                      src={p.cover.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-lg group-hover:underline">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-muted">{p.excerpt}</p>}
                  <p className="mt-3 text-sm text-muted">
                    {p.publishedAt && (
                      <time dateTime={p.publishedAt}>
                        {dateFmt.format(new Date(p.publishedAt))}
                      </time>
                    )}
                    {p.readingMinutes ? ` · ${p.readingMinutes} min de lectura` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
