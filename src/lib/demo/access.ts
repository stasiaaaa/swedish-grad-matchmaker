import { currentAccount, homeFor } from "./store";

export function localDestination(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  const account = currentAccount();
  if (!account)
    return path === "/demo" || path.startsWith("/demo/") ? { to: "/auth" as const } : undefined;
  const home = { to: homeFor(account.role) };
  if (path === "/auth" || path === "/" || path === "/demo") return home;
  if (account.role === "company") {
    if (!["/demo/foretag", "/demo/studenter"].includes(path)) return home;
  } else {
    if (path === "/my-jobs")
      return { to: "/demo/student" as const, search: { view: "tracked" as const } };
    if (path === "/onboarding")
      return { to: "/demo/student" as const, search: { view: "profile" as const } };
    if (path.startsWith("/jobs/"))
      return { to: "/demo/jobb/$id" as const, params: { id: path.slice(6) } };
    if (path !== "/demo/student" && !path.startsWith("/demo/jobb/")) return home;
  }
  return undefined;
}
