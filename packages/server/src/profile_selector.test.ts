import { describe, expect, test, beforeEach } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { profileIdForEventCode, type ProfileMeta } from "lib";
import { ProfileSelector } from "./profile_selector";

const PROFILES: ProfileMeta[] = [
  { id: "default", name: "Default" },
  { id: "alpha", name: "Alpha", eventCodes: ["MIABC"] },
  { id: "beta", name: "Beta", eventCodes: ["midef", "MIXYZ"] },
  { id: "gamma", name: "Gamma", eventCodes: ["MIXYZ"] },
];

describe("profileIdForEventCode", () => {
  test("matches case-insensitively", () => {
    expect(profileIdForEventCode("miabc", PROFILES)).toBe("alpha");
    expect(profileIdForEventCode(" MIDEF ", PROFILES)).toBe("beta");
  });
  test("no match and ambiguous match select nothing", () => {
    expect(profileIdForEventCode("MINOPE", PROFILES)).toBeNull();
    expect(profileIdForEventCode("MIXYZ", PROFILES)).toBeNull();
    expect(profileIdForEventCode("", PROFILES)).toBeNull();
    expect(profileIdForEventCode(null, PROFILES)).toBeNull();
  });
});

describe("ProfileSelector event code rule", () => {
  let dir: string;
  const make = () => new ProfileSelector({ dir, profiles: PROFILES });
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ad-profile-"));
  });

  test("starts on default with source default", () => {
    expect(make().getSelection()).toEqual({ id: "default", source: "default" });
  });

  test("a matching code selects the profile with source event", () => {
    const s = make();
    expect(s.applyEventCode("miabc")).toBe("alpha");
    expect(s.getSelection()).toEqual({ id: "alpha", source: "event" });
    expect(readFileSync(join(dir, ".active-profile"), "utf-8")).toBe("alpha");
  });

  test("no match leaves a manual choice alone", () => {
    const s = make();
    s.set("beta");
    expect(s.applyEventCode("MINOPE")).toBeNull();
    expect(s.getSelection()).toEqual({ id: "beta", source: "manual" });
  });

  test("manual pick after an automatic one stands until the code changes", () => {
    const s = make();
    s.applyEventCode("MIABC");
    s.set("beta");
    expect(s.applyEventCode("MIABC")).toBeNull();
    expect(s.applyEventCode("miabc")).toBeNull();
    expect(s.getSelection()).toEqual({ id: "beta", source: "manual" });
    // Code changes (to one with no profile) and back: that is a change.
    s.applyEventCode("MINOPE");
    expect(s.get()).toBe("beta");
    expect(s.applyEventCode("MIABC")).toBe("alpha");
    expect(s.getSelection()).toEqual({ id: "alpha", source: "event" });
  });

  test("a manual pick survives a restart with the same code", () => {
    const s = make();
    s.applyEventCode("MIABC");
    s.set("beta");
    const after = make();
    expect(after.getSelection()).toEqual({ id: "beta", source: "manual" });
    expect(after.applyEventCode("MIABC")).toBeNull();
    expect(after.get()).toBe("beta");
  });

  test("an automatic pick reads back as source event after a restart", () => {
    make().applyEventCode("MIDEF");
    expect(make().getSelection()).toEqual({ id: "beta", source: "event" });
  });

  test("a code with no profile does not block a later match for it", () => {
    writeFileSync(join(dir, ".active-profile"), "default");
    const s = make();
    s.applyEventCode("MINOPE");
    expect(existsSync(join(dir, ".active-profile-event"))).toBe(false);
  });

  test("listeners hear id and source changes", () => {
    const s = make();
    const seen: string[] = [];
    s.onChange((id, source) => seen.push(`${id}:${source}`));
    s.applyEventCode("MIABC");
    s.set("alpha");
    s.set("alpha");
    expect(seen).toEqual(["alpha:event", "alpha:manual"]);
  });
});
