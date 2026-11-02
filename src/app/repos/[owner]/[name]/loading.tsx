export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="h-12 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-6 w-48 animate-pulse rounded-full bg-surface-2" />
          <div className="h-24 animate-pulse rounded bg-surface" />
          <div className="h-40 animate-pulse rounded bg-surface" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-surface" />
      </div>
    </main>
  );
}
