import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (location.pathname === "/onboarding" && data.user?.user_metadata["account_type"] === "company") throw redirect({to:"/demo", search:{role:"company"}});
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.pathname } });
  },
  component: () => <Outlet />,
});
