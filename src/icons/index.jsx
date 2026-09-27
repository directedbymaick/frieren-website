export const Icon = ({ children, className = 'w-4 h-4', strokeWidth = 1.6 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const ChevronRight = (p) => (
  <Icon {...p}><polyline points="9 18 15 12 9 6" /></Icon>
);

export const Close = (p) => (
  <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>
);
export const Menu = (p) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
export const ChevronLeft = (p) => (
  <Icon {...p}><polyline points="15 18 9 12 15 6" /></Icon>
);
export const ChevronDown = (p) => (
  <Icon {...p}><polyline points="6 9 12 15 18 9" /></Icon>
);
export const ChevronUp = (p) => (
  <Icon {...p}><polyline points="18 15 12 9 6 15" /></Icon>
);
export const ArrowUpRight = (p) => (
  <Icon {...p}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </Icon>
);
export const Play = (p) => (
  <Icon {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" /></Icon>
);
export const BookOpen = (p) => (
  <Icon {...p}>
    <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
    <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
  </Icon>
);
export const Leaf = (p) => (
  <Icon {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 13-10-1 9-5 13-10 13a7 7 0 0 1-2-.3" />
    <path d="M4 13c4-1 7-3 10-7" />
  </Icon>
);
export const Minimize = (p) => (
  <Icon {...p} strokeWidth={1.8}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Icon>
);
export const Maximize = (p) => (
  <Icon {...p} strokeWidth={1.8}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Icon>
);

export const RuneMark = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2 L12 22" />
    <path d="M5 6 L12 11 L19 6" />
    <path d="M5 18 L12 13 L19 18" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
