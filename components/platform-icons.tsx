interface IconProps {
  className?: string
  size?: number
}

export function InstagramIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#ffd600" />
          <stop offset="30%" stopColor="#ff6930" />
          <stop offset="52%" stopColor="#e0326c" />
          <stop offset="100%" stopColor="#6a00b5" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
    </svg>
  )
}

export function YouTubeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
      <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="white" />
    </svg>
  )
}

export function TikTokIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#010101" />
      <path
        d="M16.5 5.5c.3 1.8 1.4 2.8 3 3v2.3c-1 .1-2-.2-3-.8v5.5c0 3.1-2.1 5-4.8 4.5-2.3-.5-3.7-2.7-3.2-5 .5-2.2 2.6-3.5 4.8-3v2.4c-1.2-.3-2.3.4-2.5 1.6-.2 1.2.6 2.2 1.8 2.3 1.3.1 2.2-1 2.2-2.3V5.5h1.7z"
        fill="white"
      />
      <path
        d="M15.8 5.5c.3 1.8 1.4 2.8 3 3v2.3c-1 .1-2-.2-3-.8"
        fill="#69C9D0"
      />
    </svg>
  )
}

export function LinkedInIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="5" fill="#0077B5" />
      <path
        d="M7 10h2.5v7H7v-7zm1.25-1.8a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zM17 17h-2.5v-3.5c0-1-.8-1.5-1.5-1.5s-1.5.5-1.5 1.5V17H9v-7h2.4v1c.5-.8 1.4-1.2 2.4-1.2 1.8 0 3.2 1.3 3.2 3.5V17z"
        fill="white"
      />
    </svg>
  )
}

export function XIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="5" fill="#000000" />
      <path
        d="M13.5 10.9L18.3 5.5h-1.2l-4.1 4.8L9.7 5.5H5.5l5.1 7.4-5.1 5.6h1.2l4.4-5.1 3.5 5.1h4.2l-5.3-7.6zm-1.5 1.8l-.5-.7-4-5.7h1.7l3.2 4.6.5.7 4.2 5.9h-1.7l-3.4-4.8z"
        fill="white"
      />
    </svg>
  )
}

export function getPlatformIcon(plataforma: string, size = 24, className?: string) {
  switch (plataforma) {
    case 'instagram': return <InstagramIcon size={size} className={className} />
    case 'youtube':   return <YouTubeIcon   size={size} className={className} />
    case 'tiktok':    return <TikTokIcon    size={size} className={className} />
    case 'linkedin':  return <LinkedInIcon  size={size} className={className} />
    case 'twitter':   return <XIcon         size={size} className={className} />
    default:          return null
  }
}
