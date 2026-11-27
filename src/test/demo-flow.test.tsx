import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { webcrypto } from "node:crypto";
import { expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { currentAccount } from "@/lib/demo/store";

vi.mock("@/hooks/useAuth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock("@/lib/queries", async (original) => ({
  ...(await original<object>()),
  jobsQuery: () => ({
    queryKey: ["jobs"],
    queryFn: async () => [
      {
        id: "public",
        title: "Public internship",
        required_skills: ["React"],
        company: { name: "Example" },
        source_url: "https://example.org/jobs/1",
      },
      { id: "empty", title: "Open application", required_skills: [], company: { name: "Example" } },
    ],
  }),
}));

it("registers both roles from home and restores their listings, purchases, preferences and applications", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
  // jsdom renders the application body without loading the document's external stylesheets.
  Object.assign(routeTree.options, {
    shellComponent: ({ children }: React.PropsWithChildren) => <>{children}</>,
  });
  function mount() {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
      history: createMemoryHistory({ initialEntries: ["/"] }),
      defaultPendingMinMs: 0,
    });
    return { router, ...render(<RouterProvider router={router} />) };
  }
  let app = mount();
  const link = async (name: string | RegExp) =>
    fireEvent.click((await screen.findAllByRole("link", { name })).at(-1)!);
  const button = async (name: string) =>
    fireEvent.click(await screen.findByRole("button", { name }));
  const fill = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
  const logout = async () => {
    await button("Log out");
    await screen.findByRole("heading", { name: "Log in" });
  };
  async function register(name: string, company = false) {
    await link("Create profile");
    await screen.findByRole("heading", { name: "Create profile" });
    if (company) fireEvent.click(screen.getByLabelText("Company"));
    fill("Name", name);
    fill("Email", name + "@example.org");
    fill("Password", "x");
    await button("Create profile");
    await screen.findByRole("heading", { name });
  }
  async function login(name: string) {
    fill("Email", name + "@example.org");
    fill("Password", "x");
    await button("Log in");
    await screen.findByRole("heading", { name });
  }
  await register("Studio", true);
  await button("Create job listing");
  fill("Job title", "Graduate developer");
  fill("Application URL", "https://example.org/apply");
  for (const skill of ["React", "Machine learning", "Docker", "Java"]) {
    fill("Skill requirements", skill);
    await button("Add skill");
  }
  expect(screen.getByRole("link", { name: /TDDE01/ })).toBeVisible();
  await button("Publish listing");
  await link("Find matching students");
  await screen.findByRole("heading", { name: /Find students \(50\)/ });
  const ranked = within(screen.getByRole("main"))
    .getAllByRole("listitem")
    .map((row) =>
      Number(
        within(row)
          .getByText(/% match/)
          .textContent?.match(/(\d+)% match/)?.[1],
      ),
    );
  expect(ranked).toHaveLength(50);
  expect(ranked).toEqual([...ranked].sort((a, b) => b - a));
  fill("Search by name, programme or skill", "Elsa Lind");
  fireEvent.click(screen.getAllByRole("button", { name: /Elsa Lind/ })[0]!);
  expect(screen.getByText(/@students.example.org/)).toBeVisible();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await link(/^Company dashboard$/);
  await button("Boost listing");
  await link("Cart (1)");
  await button("Remove");
  expect(screen.getByRole("button", { name: "Pay" })).toBeDisabled();
  await link("Company dashboard");
  await button("Boost listing");
  await act(() => app.router.navigate({ to: "/jobs" }));
  expect(app.router.state.location.pathname).toBe("/demo/foretag");
  for (const to of ["/onboarding", "/demo/student", "/my-jobs"] as const) {
    await act(() => app.router.navigate({ to }));
    expect(app.router.state.location.pathname).toBe("/demo/foretag");
  }
  await logout();
  await register("StudentOne");
  await link("Edit profile");
  await screen.findByRole("heading", { name: "Edit profile" });
  fireEvent.click(screen.getByText("Job preferences"));
  fireEvent.click(screen.getByLabelText("Internship"));
  fireEvent.click(screen.getByText("CV and Ladok"));
  await button("Upload CV");
  await button("Upload CV");
  expect(screen.getByRole("status")).toHaveTextContent("Already imported");
  await link("Find jobs");
  const card = () => screen.findByRole("link", { name: /Graduate developer/ });
  expect(await card()).toHaveTextContent("25% match · 1 of 4");
  expect(await card()).not.toHaveTextContent("Boosted");
  await logout();
  await register("StudentTwo");
  await link("Edit profile");
  fireEvent.click(await screen.findByText("CV and Ladok"));
  await button("Upload CV");
  await button("Upload Ladok transcript");
  await link("Find jobs");
  expect(await card()).toHaveTextContent("50% match · 2 of 4");
  expect(await card()).not.toHaveTextContent("Boosted");
  await logout();
  await login("Studio");
  await link("Cart (1)");
  await button("Pay");
  await link("Company dashboard");
  expect(await screen.findByRole("button", { name: "Boost purchased" })).toBeDisabled();
  await logout();
  await login("StudentOne");
  expect(await card()).toHaveTextContent("25% match");
  expect(await card()).not.toHaveTextContent("Boosted");
  expect(currentAccount()?.preferences).toContain("internship");
  await logout();
  await login("StudentTwo");
  expect(await card()).toHaveTextContent("Boosted");
  expect(await card()).toHaveTextContent("50% match");
  expect(screen.getAllByRole("link").indexOf(await card())).toBeLessThan(
    screen.getAllByRole("link").indexOf(screen.getByRole("link", { name: /Public internship/ })),
  );
  expect(screen.getByRole("link", { name: /Open application/ })).toHaveTextContent(
    "No requirements listed",
  );
  fireEvent.click(await card());
  await screen.findByRole("heading", { name: "Graduate developer" });
  expect(screen.getByText(/50% match/)).toBeVisible();
  expect(screen.getAllByText("Missing").length).toBe(2);
  expect(screen.getByRole("link", { name: /TDDE01/ }).closest("li")).toHaveTextContent("Completed");
  expect(screen.getByRole("link", { name: /TDDE15/ }).closest("li")).toHaveTextContent(
    "Not completed",
  );
  await button("Save job");
  const apply = await screen.findByRole("link", { name: "Apply on company site" });
  expect(apply).toHaveAttribute("href", "https://example.org/apply");
  expect(apply).toHaveAttribute("target", "_blank");
  fireEvent.click(apply);
  fireEvent.click(apply);
  await link("My jobs");
  await screen.findByRole("heading", { name: "My jobs" });
  expect(
    within(screen.getByRole("heading", { name: "Applied" }).parentElement!).getAllByRole("link"),
  ).toHaveLength(1);
  fill("Stage for Graduate developer", "Interview");
  await link("Graduate developer");
  await link("Apply on company site");
  await logout();
  app.unmount();
  app = mount();
  await link("Log in");
  await screen.findByRole("heading", { name: "Log in" });
  fill("Email", "StudentTwo@example.org");
  fill("Password", "wrong");
  await button("Log in");
  expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
  await login("StudentTwo");
  await link("My jobs");
  await waitFor(() =>
    expect(screen.getByLabelText("Stage for Graduate developer")).toHaveValue("Interview"),
  );
  await logout();
  await login("Studio");
  expect(screen.getByRole("button", { name: "Boost purchased" })).toBeDisabled();
  await logout();
  await register("AnotherCompany", true);
  expect(screen.queryByText("Graduate developer")).toBeNull();
  app.unmount();
  vi.unstubAllGlobals();
}, 30000);
