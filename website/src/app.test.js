import { describe, expect, it } from "vitest";
import { classifySpotifyUrl, isSpotifyUrl } from "./app.js";

describe("Spotify URL helpers", () => {
  it("accepts Spotify track, album, and playlist URLs", () => {
    expect(isSpotifyUrl("https://open.spotify.com/track/abc123")).toBe(true);
    expect(isSpotifyUrl("https://open.spotify.com/album/abc123")).toBe(true);
    expect(isSpotifyUrl("https://open.spotify.com/playlist/abc123")).toBe(true);
  });

  it("rejects unsupported URLs", () => {
    expect(isSpotifyUrl("https://example.com/album/abc123")).toBe(false);
    expect(isSpotifyUrl("https://open.spotify.com/artist/abc123")).toBe(false);
    expect(isSpotifyUrl("not a url")).toBe(false);
  });

  it("classifies supported Spotify URLs", () => {
    expect(classifySpotifyUrl("https://open.spotify.com/playlist/abc123")).toBe(
      "playlist",
    );
  });
});
