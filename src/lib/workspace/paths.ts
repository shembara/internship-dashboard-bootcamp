export function isDarkWorkspacePath(pathname: string) {
  return (
    pathname.startsWith("/guest") ||
    pathname.startsWith("/intern") ||
    pathname.startsWith("/teammate") ||
    pathname === "/forbidden" ||
    pathname.startsWith("/manager/internships") ||
    pathname === "/manager/people"
  );
}
