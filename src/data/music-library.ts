import {
  auraDiscoverAtmospheres,
  auraFeaturedAlbums,
  auraTracks,
  getAuraTracksByIds,
} from "@/data/aura-content";

export type DiscoverAtmosphere = (typeof auraDiscoverAtmospheres)[number];

export const tracks = auraTracks;

export const likedTrackIds = tracks
  .filter(track => track.liked)
  .map(track => track.id);

export const featuredAlbums = auraFeaturedAlbums;

export const discoverAtmospheres: DiscoverAtmosphere[] = auraDiscoverAtmospheres;

export const getTracksByIds = getAuraTracksByIds;
