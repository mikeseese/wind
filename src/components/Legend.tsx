export default function Legend() {
  return (
    <section id="legend" className="relative py-20 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Legend
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Understanding the alerts
          </h2>
          <p className="mx-auto max-w-2xl text-muted text-lg">
            Wind conditions are color-coded based on speed and gust thresholds
            during daylight sailing hours (9 AM to 15 min before sunset).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Calm */}
          <div className="group glass rounded-2xl p-8 transition-all duration-300 hover:bg-surface-hover hover:scale-[1.02]">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-wind-calm/10 text-wind-calm">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-wind-calm">Calm</h3>
            <p className="text-sm text-muted leading-relaxed">
              Wind speed below 8 knots. Good conditions for sailing with
              manageable winds.
            </p>
          </div>

          {/* Moderate */}
          <div className="group glass-warning rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02]">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-wind-moderate/10 text-wind-moderate">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-wind-moderate">
              Moderate
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Wind speed at or above 8 knots. Stronger winds — exercise caution
              depending on your experience.
            </p>
          </div>

          {/* Strong */}
          <div className="group glass-danger rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02]">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-wind-strong/10 text-wind-strong">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-wind-strong">
              Strong
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Wind speed at or above 8 knots with gusts at or above 15 knots.
              High winds — use extreme caution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
