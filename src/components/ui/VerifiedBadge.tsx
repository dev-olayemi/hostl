/**
 * VerifiedBadge — inline SVG, renders instantly with text.
 * No image loading, no network request, scales perfectly at any size.
 *
 * Badge types by account_type:
 *   personal     → circle checkmark (blue)       — celebrities, high-profile individuals
 *   company      → wavy badge (blue)              — businesses, organizations
 *   organization → wavy badge (blue)              — nonprofits, institutions
 *   government   → square-ish badge (grey-blue)   — official government accounts
 *   service      → shield checkmark (purple)      — API/SDK bots, noreply senders
 *   commerce     → bag checkmark (green)          — e-commerce, marketplaces
 */

interface VerifiedBadgeProps {
  accountType?: string
  size?: number
  className?: string
}

// ── Colors ────────────────────────────────────────────────────
const BLUE   = '#1877F2'
const GOVGREY = '#829AAB'
const PURPLE = '#7C3AED'
const GREEN  = '#16A34A'

export default function VerifiedBadge({
  accountType = 'personal',
  size = 16,
  className = '',
}: VerifiedBadgeProps) {
  const shared = {
    width: size,
    height: size,
    display: 'inline-block' as const,
    verticalAlign: 'middle' as const,
    flexShrink: 0,
  }

  // ── Commerce: bag-check (green) ───────────────────────────
  if (accountType === 'commerce') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
        style={shared} className={className} aria-label="Verified commerce" role="img">
        <path fill={GREEN} d="M454.65 169.4A31.82 31.82 0 00432 160h-64v-16a112 112 0 00-224 0v16H80a32 32 0 00-32 32v216c0 39 33 72 72 72h272a72.22 72.22 0 0050.48-20.55 69.48 69.48 0 0021.52-50.2V192a31.75 31.75 0 00-9.35-22.6zM332.49 274l-89.6 112a16 16 0 01-12.23 6h-.26a16 16 0 01-12.16-5.6l-38.4-44.88a16 16 0 1124.32-20.8L230 350.91 307.51 254a16 16 0 0125 20zM336 160H176v-16a80 80 0 01160 0z"/>
      </svg>
    )
  }

  // ── Service: shield-checkmark (purple) ───────────────────
  if (accountType === 'service') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
        style={shared} className={className} aria-label="Verified service" role="img">
        <path fill={PURPLE} d="M479.07 111.36a16 16 0 00-13.15-14.74c-86.5-15.52-122.61-26.74-203.33-63.2a16 16 0 00-13.18 0C168.69 69.88 132.58 81.1 46.08 96.62a16 16 0 00-13.15 14.74c-3.85 61.11 4.36 118.05 24.43 169.24A349.47 349.47 0 00129 393.11c53.47 56.73 110.24 81.37 121.07 85.73a16 16 0 0012 0c10.83-4.36 67.6-29 121.07-85.73a349.47 349.47 0 0071.5-112.51c20.07-51.19 28.28-108.13 24.43-169.24zm-131 75.11l-110.8 128a16 16 0 01-11.41 5.53h-.66a16 16 0 01-11.2-4.57l-49.2-48.2a16 16 0 1122.4-22.86l37 36.29 99.7-115.13a16 16 0 0124.2 20.94z"/>
      </svg>
    )
  }

  // ── Government: square-ish badge (grey-blue, as designed) ─
  if (accountType === 'government') {
    return (
      <svg viewBox="1.6009846 1.60005504 18.8000308 18.79949552"
        xmlns="http://www.w3.org/2000/svg"
        style={shared} className={className} aria-label="Verified government" role="img">
        <path clipRule="evenodd" fillRule="evenodd" fill={GOVGREY}
          d="m12.05 2.056a1.437 1.437 0 0 0 -2.1 0l-1.393 1.49c-.284.303-.685.47-1.1.455l-2.037-.069a1.438 1.438 0 0 0 -1.486 1.486l.069 2.039c.014.415-.152.816-.456 1.1l-1.49 1.392a1.438 1.438 0 0 0 0 2.101l1.49 1.393c.304.284.47.684.456 1.1l-.07 2.038a1.44 1.44 0 0 0 1.487 1.486l2.038-.069c.415-.014.816.152 1.1.455l1.392 1.49a1.438 1.438 0 0 0 2.102 0l1.393-1.49c.283-.303.684-.47 1.099-.455l2.038.069a1.438 1.438 0 0 0 1.486-1.486l-.068-2.039a1.436 1.436 0 0 1 .455-1.099l1.49-1.393a1.438 1.438 0 0 0 0-2.101l-1.49-1.393a1.435 1.435 0 0 1 -.455-1.1l.068-2.038a1.438 1.438 0 0 0 -1.486-1.486l-2.038.07a1.446 1.446 0 0 1 -1.1-.456zm-5.817 9.367 3.429 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z"/>
      </svg>
    )
  }

  // ── Company / Organization: wavy badge (blue) ─────────────
  if (accountType === 'company' || accountType === 'organization') {
    return (
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"
        style={shared} className={className} aria-label="Verified organization" role="img">
        <path fill={BLUE}
          d="m512 268c0 17.9-4.3 34.5-12.9 49.7s-20.1 27.1-34.6 35.4c.4 2.7.6 6.9.6 12.6 0 27.1-9.1 50.1-27.1 69.1-18.1 19.1-39.9 28.6-65.4 28.6-11.4 0-22.3-2.1-32.6-6.3-8 16.4-19.5 29.6-34.6 39.7-15 10.2-31.5 15.2-49.4 15.2-18.3 0-34.9-4.9-49.7-14.9-14.9-9.9-26.3-23.2-34.3-40-10.3 4.2-21.1 6.3-32.6 6.3-25.5 0-47.4-9.5-65.7-28.6-18.3-19-27.4-42.1-27.4-69.1 0-3 .4-7.2 1.1-12.6-14.5-8.4-26-20.2-34.6-35.4-8.5-15.2-12.8-31.8-12.8-49.7 0-19 4.8-36.5 14.3-52.3s22.3-27.5 38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3 0-27 9.1-50.1 27.4-69.1s40.2-28.6 65.7-28.6c11.4 0 22.3 2.1 32.6 6.3 8-16.4 19.5-29.6 34.6-39.7 15-10.1 31.5-15.2 49.4-15.2s34.4 5.1 49.4 15.1c15 10.1 26.6 23.3 34.6 39.7 10.3-4.2 21.1-6.3 32.6-6.3 25.5 0 47.3 9.5 65.4 28.6s27.1 42.1 27.1 69.1c0 12.6-1.9 24-5.7 34.3 16 7.6 28.8 19.3 38.3 35.1 9.5 15.9 14.3 33.4 14.3 52.4zm-266.9 77.1 105.7-158.3c2.7-4.2 3.5-8.8 2.6-13.7-1-4.9-3.5-8.8-7.7-11.4-4.2-2.7-8.8-3.6-13.7-2.9-5 .8-9 3.2-12 7.4l-93.1 140-42.9-42.8c-3.8-3.8-8.2-5.6-13.1-5.4-5 .2-9.3 2-13.1 5.4-3.4 3.4-5.1 7.7-5.1 12.9 0 5.1 1.7 9.4 5.1 12.9l58.9 58.9 2.9 2.3c3.4 2.3 6.9 3.4 10.3 3.4 6.7-.1 11.8-2.9 15.2-8.7z"/>
      </svg>
    )
  }

  // ── Personal: circle checkmark (blue) — default ───────────
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
      style={shared} className={className} aria-label="Verified account" role="img">
      <path fill={BLUE}
        d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
    </svg>
  )
}
