import { fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import {
  createRootRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, it, vi } from "vitest";
import { Route as demoRoute } from "@/routes/demo";

it("publishes a job, ranks students, explains the match and persists a boost", async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
  const root = createRootRoute();
  const page = demoRoute.update({
    id: "/demo",
    path: "/demo",
    getParentRoute: () => root,
  } as never);
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/demo?role=company"] }),
  });
  const app = render(<RouterProvider router={router} />);
  const click = async (name: string) => fireEvent.click(await screen.findByRole("link", { name }));
  const fill = (name: string, value: string) =>
    fireEvent.change(screen.getByLabelText(name), { target: { value } });

  await click("Skapa jobbannons");
  await screen.findByRole("heading", { name: "Skapa jobbannons" });
  fill("Jobbtitel", "Analytiker");
  fill("Ort", "Linköping");
  fill("Beskrivning", "Analysera energidata.");
  for (const skill of ["Git", "SQL", "Maskininlärning", "Docker"]) {
    fill("Kompetenskrav", skill);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
  }
  expect(screen.getByRole("link", { name: /TDDD37/ })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Publicera annons" }));
  const article = (await screen.findByRole("heading", { name: "Analytiker" })).closest("article")!;
  fireEvent.click(within(article).getByRole("link"));
  await screen.findByRole("heading", { name: "Studenter (50)" });
  const ranked = screen.getAllByRole("listitem");
  const scores = ranked.map((li) =>
    Number(
      within(li)
        .getByText(/% matchning/)
        .textContent?.match(/(\d+) % matchning/)?.[1],
    ),
  );
  expect(scores).toHaveLength(50);
  expect(scores).toEqual([...scores].sort((a, b) => b - a));
  expect(new Set(scores).size).toBeGreaterThan(1);
  fireEvent.click(within(ranked[0]!).getByRole("link"));
  await screen.findByRole("heading", { name: "Avklarade kurser" });

  await click("Växla till student");
  await click("Min profil");
  const cv = await screen.findByRole("button", { name: "Ladda upp CV" });
  fireEvent.click(cv);
  fireEvent.click(cv);
  expect(screen.getByRole("status")).toHaveTextContent("redan inläst");
  fireEvent.click(screen.getByRole("button", { name: "Ladda upp Ladok-resultatintyg" }));
  await click("Jobbflöde");
  await click("Analytiker");
  await screen.findByRole("heading", { name: "75 % matchning · 3 av 4 krav uppfyllda" });
  expect(screen.getByText("Docker · Saknas")).toBeVisible();
  expect(screen.getByRole("link", { name: /TDDE01/ }).closest("li")).toHaveTextContent("Avklarad");
  expect(screen.getByRole("link", { name: /TDDE15/ }).closest("li")).toHaveTextContent(
    "Ej avklarad",
  );

  await click("Växla till företag");
  await screen.findByRole("heading", {name:"Mina annonser"});
  const posted = (await screen.findByRole("heading", { name: "Analytiker" })).closest("article")!;
  fireEvent.click(within(posted).getByRole("checkbox"));
  await click("Växla till student");
  await screen.findByRole("heading", {name:"Jobb för dig"});
  const first = (await screen.findAllByRole("article"))[0]!;
  expect(first).toHaveTextContent("Analytiker");
  expect(first).toHaveTextContent("Boostad");
  expect(first).toHaveTextContent("75 % matchning");

  app.unmount();
  vi.resetModules();
  const { useDemo } = await import("@/lib/demo/store");
  const { result } = renderHook(useDemo);
  expect(result.current.students).toHaveLength(50);
  expect(result.current.jobs.filter((j) => j.title === "Analytiker")).toMatchObject([
    { boosted: true },
  ]);
  expect(result.current.students[0]?.courses).toContain("TDDE01");
});
