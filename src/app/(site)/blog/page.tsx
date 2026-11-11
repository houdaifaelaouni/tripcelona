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
    <div className="container-site py-8 md:py-16">
      <h1 className="text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl">
        Blog
      </h1>
      <p className="mt-1 text-tertiary">Guías de destinos y consejos para tus excursiones.</p>
      {posts.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-secondary px-6 py-12 text-center text-tertiary">
          Pronto publicaremos nuevas guías.
        </p>
      ) : (
        <ul className="mt-8 grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <article className="group relative flex flex-col gap-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
                  {p.cover && (
                    <Image
                      src={p.cover.url}
                      alt=""
                      fill
                      sizes="(min-width: 1128px) 400px, (min-width: 744px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                  )}
                </div>
                <div>
                  <p className="text-caption text-tertiary">
                    {p.publishedAt && (
                      <time dateTime={p.publishedAt}>
                        {dateFmt.format(new Date(p.publishedAt))}
                      </time>
                    )}
                    {p.readingMinutes ? ` · ${p.readingMinutes} min de lectura` : ""}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-base font-semibold">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none group-hover:underline group-focus-within:underline"
                    >
                      {p.title}
                    </Link>
                  </h2>
                  {p.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-tertiary">{p.excerpt}</p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
