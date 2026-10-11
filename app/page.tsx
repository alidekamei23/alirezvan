import { lawyer } from "@/content/lawyer";

// Placeholder. The real Home page is built in session 2.
export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold leading-relaxed text-ink">
        {lawyer.name}
      </h1>
      <p className="mt-2 text-lg text-muted">{lawyer.grade}</p>
    </section>
  );
}
