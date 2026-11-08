const legacyRoots = ["learn", "workshop", "ladder", "classroom", "play"] as const;

export function legacyDestination(pathname: string): string | null {
  for (const root of legacyRoots) {
    if (pathname === `/${root}`) return `/legacy/${root}`;
    if (pathname.startsWith(`/${root}/`)) return `/legacy${pathname}`;
  }
  return null;
}
