// Global SVG displacement filter that powers the iOS 26 "liquid glass" refraction.
// Referenced via CSS: backdrop-filter: url(#liquid-distortion)
export default function GlassFilter() {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id="liquid-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="2"
            seed="7"
            result="turb"
          />
          <feGaussianBlur in="turb" stdDeviation="2" result="softTurb" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softTurb"
            scale="60"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="liquid-distortion-soft" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.03"
            numOctaves="1"
            seed="3"
            result="turb"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turb"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
