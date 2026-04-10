export default function Hero() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-radial-primary" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/6 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow [animation-delay:1.5s]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Wind icon */}
        <div className="flex justify-center mb-8">
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full glass-primary glow-primary-strong">
              <svg
                className="w-12 h-12 text-primary-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-13.5L16.5 7.5m0 0L12 3m4.5 4.5V21"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="block">Wind alerts for</span>
          <span className="block bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent">
            sailing days
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed mb-10">
          14-day wind forecast for Vancouver Lake. Hourly conditions during
          daylight hours with alerts for speeds above 8 kn and gusts above 15 kn.
        </p>

        {/* Quick stats badges */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 inline-block rounded-full bg-wind-calm mr-2" />
            &lt; 8 kn Calm
          </span>
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 inline-block rounded-full bg-wind-moderate mr-2" />
            &ge; 8 kn Wind
          </span>
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 inline-block rounded-full bg-wind-strong mr-2" />
            &ge; 8 kn + 15 kn Gusts
          </span>
        </div>
      </div>
    </section>
  );
}
