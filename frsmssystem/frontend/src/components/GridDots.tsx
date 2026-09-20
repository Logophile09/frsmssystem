/**
 * Faint dot-grid texture + a couple of hairline rings, used behind the
 * dark "command console" panel on the Dashboard. Deliberately monochrome
 * and low-opacity — texture, not color — unlike AmbientGlow's colored blobs.
 */
export default function GridDots() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
      <div className="absolute -right-28 -top-28 h-[26rem] w-[26rem] rounded-full border border-white/[0.07]" />
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-white/[0.06]" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/[0.05]" />
    </div>
  );
}
