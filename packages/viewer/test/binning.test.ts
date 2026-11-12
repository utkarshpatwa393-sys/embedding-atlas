// Copyright (c) 2026 Apple Inc. Licensed under MIT License.

import * as SQL from "@uwdata/mosaic-sql";
import { describe, expect, test } from "vitest";

import { inferBinning, inferTimeBinning } from "../src/charts/common/binning.js";

describe("inferBinning", () => {
  test("produces finite bins and non-degenerate domain when min === max", () => {
    for (const scale of ["linear", "log", "symlog"] as const) {
      for (const value of [0, 5, 1e16]) {
        if (scale === "log" && value === 0) {
          continue;
        }
        const b = inferBinning({ min: value, minPositive: value, max: value, median: value, count: 10 }, { scale });
        expect(b.scale.domain[1], `${scale}:${value}`).toBeGreaterThan(b.scale.domain[0]);
        const idx = b.binIndex(value);
        expect(Number.isFinite(idx), `${scale}:${value} binIndex`).toBe(true);
        const [lo, hi] = b.rangeForIndex(idx);
        expect(Number.isFinite(lo) && Number.isFinite(hi)).toBe(true);
        expect(hi).toBeGreaterThan(lo);
        expect(b.binIndexExpr(SQL.column("x")).toString()).not.toContain("NaN");
        expect(b.binIndexExpr(SQL.column("x")).toString()).not.toContain("Infinity");
      }
    }
  });
});

describe("inferTimeBinning", () => {
  test("produces non-degenerate fixed time domain when min === max on step boundary", () => {
    const t = 1700000000000;
    const b = inferTimeBinning({ min: t, max: t, count: 10 });
    expect(b.scale.domain[1]).toBeGreaterThan(b.scale.domain[0]);
    const idx = b.binIndex(t);
    expect(Number.isFinite(idx)).toBe(true);
    const [lo, hi] = b.rangeForIndex(idx);
    expect(hi).toBeGreaterThan(lo);
    expect(t).toBeGreaterThanOrEqual(lo);
    expect(t).toBeLessThan(hi);
  });
});
