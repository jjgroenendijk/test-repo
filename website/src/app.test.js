import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSpotifyUrl, classifySpotifyUrl } from "./app.js";

// Mock fetch globally for any component tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe("isSpotifyUrl", () => {
  it("accepts valid track URLs", () => {
    expect(isSpotifyUrl("https://open.spotify.com/track/1ATL5GLyefJaxhQzSPVrLX")).toBe(true);
  });

  it("rejects invalid hosts", () => {
    expect(isSpotifyUrl("https://soundcloud.com/track/123")).toBe(false);
  });
});

describe("classifySpotifyUrl", () => {
  it("classifies tracks", () => {
    expect(classifySpotifyUrl("https://open.spotify.com/track/123")).toBe("track");
  });
});
