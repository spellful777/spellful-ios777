/**
 * Validates and normalises Spotify / Apple Music / TIDAL playlist URLs.
 */

export type PlaylistInfo = {
  provider: 'spotify' | 'tidal' | 'apple_music';
  canonicalUrl: string;
  providerPlaylistId: string;
};

export function validatePlaylistUrl(raw: string): PlaylistInfo {
  const url = raw.trim();

  // Spotify: https://open.spotify.com/playlist/<id>
  const spotifyMatch = /^https:\/\/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/.exec(url);
  if (spotifyMatch) {
    const id = spotifyMatch[1];
    return {
      provider: 'spotify',
      canonicalUrl: `https://open.spotify.com/playlist/${id}`,
      providerPlaylistId: id,
    };
  }

  // TIDAL: https://tidal.com/browse/playlist/<uuid>
  const tidalMatch = /^https:\/\/tidal\.com\/browse\/playlist\/([0-9a-f-]+)/i.exec(url);
  if (tidalMatch) {
    const id = tidalMatch[1];
    return {
      provider: 'tidal',
      canonicalUrl: `https://tidal.com/browse/playlist/${id}`,
      providerPlaylistId: id,
    };
  }

  // Apple Music: https://music.apple.com/<storefront>/playlist/<name>/<id>
  const appleMusicMatch = /^https:\/\/music\.apple\.com\/[a-z]{2}\/playlist\/[^/]+\/(pl\.[A-Za-z0-9]+)/.exec(url);
  if (appleMusicMatch) {
    const id = appleMusicMatch[1];
    return {
      provider: 'apple_music',
      canonicalUrl: url.split('?')[0],
      providerPlaylistId: id,
    };
  }

  throw new Error(
    'Only Spotify (open.spotify.com/playlist/...), Apple Music (music.apple.com/.../playlist/...), and TIDAL (tidal.com/browse/playlist/...) playlist URLs are supported.',
  );
}
