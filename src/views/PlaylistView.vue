<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import TrackTable from "@/components/music/TrackTable.vue";
import { useGsapHoverTargets, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import {
  auraContentPlaylists,
  auraDefaultPlaylist,
  getAuraTracksByIds,
} from "@/data/aura-content";
import { usePlayerStore } from "@/stores/player";

const playlistRef = ref<HTMLElement | null>(null);
const route = useRoute();
const player = usePlayerStore();

const requestedPlaylistId = computed(() => typeof route.params.playlistId === "string" ? route.params.playlistId : null);
const requestedPlaylist = computed(() => {
  if (!requestedPlaylistId.value) {
    return null;
  }

  return auraContentPlaylists.find(item => item.id === requestedPlaylistId.value) ?? null;
});
const currentPlaylist = computed(() => {
  return requestedPlaylist.value ?? auraDefaultPlaylist;
});
const playlistTracks = computed(() => getAuraTracksByIds(currentPlaylist.value.trackIds));
const showFallbackNotice = computed(() => Boolean(requestedPlaylistId.value && !requestedPlaylist.value));
const trackRows = computed(() => playlistTracks.value.map(track => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  album: track.album,
  durationLabel: track.durationLabel,
})));
const activeTrackId = computed(() => player.currentTrack?.id ?? null);
const totalDurationLabel = computed(() => {
  const totalSeconds = playlistTracks.value.reduce((sum, track) => sum + track.durationSeconds, 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
});

function playPlaylist() {
  const firstTrackId = playlistTracks.value[0]?.id;
  if (!firstTrackId) {
    return;
  }

  void player.playContext(playlistTracks.value, firstTrackId);
}

function playTrack(trackId: string) {
  void player.playContext(playlistTracks.value, trackId);
}

function toggleLike(trackId: string) {
  player.toggleLike(trackId);
}

useGsapReveal(playlistRef, [".playlist-view__hero", ".playlist-view__table-shell", ".playlist-view__meta-grid"], 0.08);
useGsapScrollReveal(playlistRef, [
  {
    selector: ".playlist-view__meta-card",
    triggerSelector: ".playlist-view__meta-grid",
    y: 24,
    scale: 0.98,
    stagger: 0.06,
  },
]);
useGsapHoverTargets(playlistRef, [".playlist-view__meta-card", ".playlist-view__summary-item"], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section id="playlist-page" ref="playlistRef" class="page playlist-view playlist-view--stitch">
    <div class="playlist-view__ambient" aria-hidden="true">
      <span class="playlist-view__ambient-orb playlist-view__ambient-orb--primary" />
      <span class="playlist-view__ambient-orb playlist-view__ambient-orb--secondary" />
    </div>

    <article class="playlist-view__hero playlist-view__hero-shell">
      <div class="playlist-view__hero-cover">
        <img :src="currentPlaylist.coverSrc" :alt="`${currentPlaylist.title} 封面`">
      </div>
      <div class="playlist-view__hero-copy">
        <p class="playlist-view__hero-eyebrow">歌单详情</p>
        <h1 class="playlist-view__hero-title">{{ currentPlaylist.title }}</h1>
        <p class="playlist-view__hero-description">{{ currentPlaylist.description }}</p>
        <p class="playlist-view__hero-meta">{{ `${currentPlaylist.statusLabel} · ${currentPlaylist.trackIds.length} 首曲目` }}</p>
        <div class="playlist-view__hero-actions">
          <button
            data-testid="playlist-hero-play"
            type="button"
            class="playlist-view__hero-play"
            @click="playPlaylist"
          >
            立即播放
          </button>
        </div>
      </div>
    </article>

    <div class="playlist-view__meta-grid">
      <article class="playlist-view__meta-card">
        <p class="playlist-view__meta-eyebrow">歌单状态</p>
        <h2 class="playlist-view__meta-title">歌单详情</h2>
        <p class="playlist-view__meta-subtitle">{{ currentPlaylist.subtitle }}</p>
        <p class="playlist-view__meta-copy">{{ currentPlaylist.statusLabel }}</p>
        <p v-if="showFallbackNotice" class="playlist-view__meta-note">未找到指定歌单，已切回默认主打歌单。</p>
      </article>
      <article class="playlist-view__meta-card">
        <p class="playlist-view__meta-eyebrow">标签</p>
        <h2 class="playlist-view__meta-title">内容标签</h2>
        <p class="playlist-view__meta-subtitle">用于后续探索页与资料库页的关联推荐。</p>
        <div class="playlist-view__tags">
          <span v-for="tag in currentPlaylist.tags" :key="tag" class="playlist-view__tag">{{ tag }}</span>
        </div>
      </article>
    </div>

    <section class="playlist-view__table playlist-view__table-shell">
      <header class="playlist-view__table-header">
        <div>
          <p class="playlist-view__meta-eyebrow">曲目表</p>
          <h2 class="playlist-view__meta-title">歌单曲目</h2>
          <p class="playlist-view__meta-subtitle">点击播放或喜欢按钮，会直接与底部播放器和当前会话状态联动。</p>
        </div>
        <div class="playlist-view__summary">
          <div class="playlist-view__summary-item">
            <span class="playlist-view__summary-label">曲目</span>
            <strong class="playlist-view__summary-value">{{ `${playlistTracks.length} 首` }}</strong>
          </div>
          <div class="playlist-view__summary-item">
            <span class="playlist-view__summary-label">总时长</span>
            <strong class="playlist-view__summary-value">{{ totalDurationLabel }}</strong>
          </div>
        </div>
      </header>
      <TrackTable
        :tracks="trackRows"
        :liked-ids="player.likedTrackIdList"
        :active-track-id="activeTrackId"
        @play="playTrack"
        @toggle-like="toggleLike"
      />
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: 18px;
}

.playlist-view {
  position: relative;
  overflow: hidden;
}

.playlist-view--stitch {
  padding: clamp(10px, 1.25vw, 14px);
  border-radius: 22px;
  color: var(--color-text);
  isolation: isolate;
  background:
    radial-gradient(circle at 12% 10%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 36%),
    radial-gradient(circle at 92% 18%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-bg-elevated) 94%, transparent), var(--color-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 74%, transparent);
}

.playlist-view__ambient {
  position: absolute;
  inset: -180px -120px auto;
  z-index: 0;
  pointer-events: none;
}

.playlist-view__ambient-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
}

.playlist-view__ambient-orb--primary {
  top: 0;
  left: 0;
  width: 360px;
  height: 360px;
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
}

.playlist-view__ambient-orb--secondary {
  top: 80px;
  right: 0;
  width: 260px;
  height: 260px;
  background: color-mix(in srgb, var(--color-accent) 16%, var(--color-bg-elevated) 84%);
}

.playlist-view__hero,
.playlist-view__meta-card,
.playlist-view__table-shell {
  position: relative;
  z-index: 1;
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(140deg, var(--color-panel-glow-start), transparent 44%),
    var(--color-panel-fill);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-border) 92%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-panel-glow-start) 84%, transparent);
  backdrop-filter: blur(14px);
}

.playlist-view__hero {
  display: grid;
  grid-template-columns: minmax(180px, 252px) minmax(0, 1fr);
  align-items: end;
  gap: clamp(16px, 2.4vw, 22px);
  padding: clamp(14px, 2vw, 20px);
}

.playlist-view__hero-cover {
  width: min(100%, 252px);
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 32px 48px rgba(0, 0, 0, 0.42);
}

.playlist-view__hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-view__hero-copy {
  display: grid;
  gap: 0;
}

.playlist-view__hero-eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.playlist-view__hero-title {
  margin: 10px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.playlist-view__hero-description {
  max-width: 760px;
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.52;
}

.playlist-view__hero-meta {
  margin: 10px 0 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.playlist-view__hero-actions {
  margin-top: 18px;
}

.playlist-view__hero-play {
  border: none;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 9px 18px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.playlist-view__hero-play:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}

.playlist-view__meta-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.playlist-view__meta-card {
  padding: 16px;
}

.playlist-view__meta-eyebrow {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.playlist-view__meta-title {
  margin: 10px 0 0;
  color: var(--color-text-strong);
  font-size: 18px;
  line-height: 1.08;
}

.playlist-view__meta-subtitle {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.playlist-view__meta-copy {
  margin: 14px 0 0;
  color: color-mix(in srgb, var(--color-accent) 74%, var(--color-text-strong) 26%);
  font-size: 22px;
  font-weight: 700;
}

.playlist-view__meta-note {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.playlist-view__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.playlist-view__tag {
  padding: 7px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 11px;
  background: var(--color-control-surface);
}

.playlist-view__table-shell {
  padding: 18px;
}

.playlist-view__table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.playlist-view__summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.playlist-view__summary-item {
  display: grid;
  gap: 4px;
  min-width: 82px;
  padding: 9px 10px;
  border: 0;
  border-radius: 10px;
  background: var(--color-control-surface);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 88%, transparent);
}

.playlist-view__summary-label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.playlist-view__summary-value {
  color: var(--color-text-strong);
  font-size: 16px;
  line-height: 1;
}

.playlist-view__table-shell :deep(.track-table) {
  padding: 0;
  background: transparent;
  border: none;
}

.playlist-view__table-shell :deep(th) {
  color: var(--color-text-tertiary);
}

.playlist-view__table-shell :deep(td) {
  border-top-color: var(--color-border);
  color: var(--color-text-secondary);
}

.playlist-view__table-shell :deep(.track-table__title) {
  color: var(--color-text-strong);
}

.playlist-view__table-shell :deep(.track-table__artist),
.playlist-view__table-shell :deep(.track-table__duration),
.playlist-view__table-shell :deep(.track-table__album) {
  color: var(--color-text-tertiary);
}

.playlist-view__table-shell :deep(tbody tr:hover) {
  background: var(--color-control-surface);
}

.playlist-view__table-shell :deep(tbody tr[data-active="true"]) {
  background: var(--color-state-selected);
}

.playlist-view__table-shell :deep(.track-table__play-button) {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.playlist-view__table-shell :deep(.track-table__play-button:hover) {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-control-surface-strong);
}

@media (max-width: 960px) {
  .playlist-view__hero {
    grid-template-columns: 1fr;
  }

  .playlist-view__hero-cover {
    width: min(100%, 260px);
  }
}

@media (max-width: 760px) {
  .playlist-view__meta-grid {
    grid-template-columns: 1fr;
  }

  .playlist-view__table-header {
    flex-direction: column;
  }
}
</style>
