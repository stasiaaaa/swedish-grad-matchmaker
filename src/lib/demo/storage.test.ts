import { expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";

it("imports v1 listings once and restores account data from disk with a fresh store", async () => {
  const fixture = {
    id: "old",
    companyId: "old-company",
    company: "Old Company",
    title: "Legacy listing",
    city: "Linköping",
    description: "",
    boosted: true,
    createdAt: 0,
    requirements: ["Databaser"],
  };
  const storage = new Map([
    [
      "launchpad_demo_v1",
      JSON.stringify({ version: 1, jobs: [fixture, { ...fixture, id: "j3", boosted: false }] }),
    ],
  ]);
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  });
  vi.stubGlobal("crypto", webcrypto);
  try {
    const { demo } = await import("./store");
    await demo.register("First", "first@example.org", "single-browser-password", "student");
    demo.upload("courses");
    demo.logout();
    const raw = storage.get("launchpad_accounts_v2")!;
    expect(raw).not.toContain("single-browser-password");
    const saved = JSON.parse(raw);
    expect(saved.jobs).toHaveLength(5);
    expect(saved.jobs.find((j: { id: string }) => j.id === "old")).toMatchObject({
      boosted: true,
      requirements: ["Databases"],
    });
    expect(saved.jobs.find((j: { id: string }) => j.id === "j3")).toMatchObject({ boosted: false });
    vi.resetModules();
    const restored = await import("./store");
    expect(restored.currentAccount()).toBeUndefined();
    await restored.demo.login("FIRST@example.org", "single-browser-password");
    expect(restored.currentAccount()?.profile.courses).toContain("TDDE01");
    expect(JSON.parse(storage.get("launchpad_accounts_v2")!).jobs).toHaveLength(5);
  } finally {
    vi.unstubAllGlobals();
  }
});
