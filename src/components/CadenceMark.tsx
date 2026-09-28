type Props = {
  className?: string;
  size?: number | string;
  /** If true, render only the white flame+bowl glyph on a transparent background. */
  glyphOnly?: boolean;
  title?: string;
};

/**
 * Original Cadence brand mark: a stylized tulip-flame rising from a shallow bowl.
 * Drawn inline so it scales crisply and works as a favicon, header logo, and PWA icon.
 */
export function CadenceMark({ className, size = 24, glyphOnly = false, title = "Cadence" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      {!glyphOnly && <rect width="64" height="64" rx="12" fill="#EC0000" />}
      <g fill="#ffffff">
        <path d="M14 44 Q32 36 50 44 Q50 50.5 32 50.5 Q14 50.5 14 44 Z" />
        <path d="M32 13 C36.5 21 38.5 28 36.2 34 C34.4 38 29.6 38 27.8 34 C25.5 28 27.5 21 32 13 Z" />
        <path d="M24 28 C21.8 32 22.2 36.5 26 38.5 C26 34.8 25 31.2 24 28 Z" />
        <path d="M40 28 C42.2 32 41.8 36.5 38 38.5 C38 34.8 39 31.2 40 28 Z" />
      </g>
    </svg>
  );
}
