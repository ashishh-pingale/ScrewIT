const principles = [
  "Preserve each CPSE's source material code and provenance.",
  "Provide explainable recommendations for human review.",
  "Build a governed crosswalk to common material identities.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <span className="text-xl font-bold tracking-tight">ScrewIT</span>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-steel">
            Phase 1 foundation
          </span>
        </header>

        <section className="py-20 sm:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-steel">
            One Nation · One Material Identity
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
            Material-code harmonization built for trustworthy human decisions.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            ScrewIT will help Central Public Sector Enterprises identify equivalent materials across
            different catalogues while retaining local codes, technical evidence, and reviewer control.
          </p>
        </section>

        <section aria-label="Platform principles" className="grid gap-4 md:grid-cols-3">
          {principles.map((principle) => (
            <article key={principle} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 h-2 w-12 rounded bg-safety" />
              <p className="leading-7 text-slate-700">{principle}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-xl bg-ink p-8 text-white sm:p-10">
          <h2 className="text-2xl font-semibold">Platform foundation is in place.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            The next phases will add governed ingestion, deterministic normalization, candidate
            matching, and human validation. No AI matching is active in this release.
          </p>
        </section>
      </div>
    </main>
  );
}
