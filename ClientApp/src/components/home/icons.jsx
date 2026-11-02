// Inline SVG icon set for the public homepage.
// No icon package is installed (package.json deps are react + react-dom only),
// so these are hand-rolled rather than adding a dependency.
// Every icon is decorative by default (aria-hidden) — the accessible name comes
// from the surrounding button/heading, never from the glyph.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
  focusable: 'false',
}

function Icon({ children, className = 'h-5 w-5', ...rest }) {
  return (
    <svg className={className} {...base} {...rest}>
      {children}
    </svg>
  )
}

export function LogoMark({ className = 'h-6 w-auto' }) {
  return (
    <img
      src="/logo.png"
      alt="AIgnite Buildathon Logo"
      className={`${className} object-contain`}
    />
  )
}

export function SparkleIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.8L12 18l-1.7-5.5L4.8 10.7 10.3 9z" />
      <path d="M18.5 3v3M20 4.5h-3" />
    </Icon>
  )
}

export function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return (
    <Icon className={className}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  )
}

export function ChevronDownIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function ChevronLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="m14 6-6 6 6 6" />
    </Icon>
  )
}

export function ChevronRightIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="m10 6 6 6-6 6" />
    </Icon>
  )
}

export function MenuIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

/* ---------- feature + process icons ---------- */

export function CompassIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </Icon>
  )
}

export function ScholarshipIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z" />
      <path d="M6.4 10.7v4.1c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.1" />
      <path d="M21.2 8.6v5" />
    </Icon>
  )
}

export function TrackIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M8.8 3.5h6.4v2.6H8.8z" />
      <path d="m8.8 12 2.1 2.1 4.3-4.3" />
    </Icon>
  )
}

export function DocumentCheckIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M13.5 3.5H7.2A2.2 2.2 0 0 0 5 5.7v12.6a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2V9z" />
      <path d="M13.5 3.5V9H19" />
      <path d="m9.2 14.4 1.9 1.9 3.7-3.7" />
    </Icon>
  )
}

export function ShieldIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 3.2 5 6v5.4c0 4.2 2.9 8 7 9.4 4.1-1.4 7-5.2 7-9.4V6z" />
      <path d="m9.3 12 1.9 1.9 3.6-3.7" />
    </Icon>
  )
}

export function StarIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </Icon>
  )
}

export function StarFilledIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </svg>
  )
}

export function UserPlusIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="10" cy="8" r="3.6" />
      <path d="M3.6 20c0-3.2 2.9-5.7 6.4-5.7 1.3 0 2.5.3 3.5.9" />
      <path d="M18 14v5M20.5 16.5h-5" />
    </Icon>
  )
}

export function ProfileIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16.4c.5-1.4 1.8-2.2 3.2-2.2s2.7.8 3.2 2.2" />
      <path d="M15.2 10h3.6M15.2 13.4h3.6" />
    </Icon>
  )
}

export function UploadIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M4.5 15.5v2.8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.8" />
      <path d="M12 15.2V3.8" />
      <path d="m7.8 8 4.2-4.2L16.2 8" />
    </Icon>
  )
}

export function SendIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M3.5 12.2 20.5 4l-8.2 17-1.9-7z" />
      <path d="m10.4 14 3.4-3.4" />
    </Icon>
  )
}

export function BadgeCheckIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.6 12.2 2.3 2.3 4.5-4.6" />
    </Icon>
  )
}

export function TrophyIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
    </Icon>
  )
}

export function GraduationCapIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </Icon>
  )
}

export function GlobeIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </Icon>
  )
}

export function CheckIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  )
}

export function AlertTriangleIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  )
}

export function BotIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </Icon>
  )
}

export function MicIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
    </Icon>
  )
}

export function SearchIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  )
}

export function ClockIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  )
}
