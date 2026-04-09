<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import MediaHeroCard from "@/components/music/MediaHeroCard.vue";
import MediaSectionTitle from "@/components/music/MediaSectionTitle.vue";
import TrackTable from "@/components/music/TrackTable.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
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

useGsapReveal(playlistRef, [".playlist-view__hero", ".playlist-view__table", ".playlist-view__meta-grid"], 0.08);
useGsapScrollReveal(playlistRef, [
  {
    selector: ".playlist-view__meta-grid > *",
    triggerSelector: ".playlist-view__meta-grid",
    y: 24,
    scale: 0.98,
    stagger: 0.06,
  },
]);
useGsapHoverTargets(playlistRef, [".playlist-view__meta-card"], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section id="playlist-page" ref="playlistRef" class="page playlist-view">
    <UiSectionCard class="playlist-view__hero" tone="contrast">
      <MediaHeroCard
        eyebrow="歌单详情"
        :title="currentPlaylist.title"
        :description="currentPlaylist.description"
        :cover-src="currentPlaylist.coverSrc"
        :meta-line="`${currentPlaylist.statusLabel} · ${currentPlaylist.trackIds.length} 首曲目`"
        primary-test-id="playlist-hero-play"
        @primary="playPlaylist"
      />
    </UiSectionCard>

    <div class="playlist-view__meta-grid">
      <UiSectionCard class="playlist-view__meta-card">
        <MediaSectionTitle eyebrow="歌单状态" title="歌单详情" :description="currentPlaylist.subtitle" />
        <p class="playlist-view__meta-copy">{{ currentPlaylist.statusLabel }}</p>
        <p v-if="showFallbackNotice" class="playlist-view__meta-note">未找到指定歌单，已切回默认主打歌单。</p>
      </UiSectionCard>
      <UiSectionCard class="playlist-view__meta-card">
        <MediaSectionTitle eyebrow="标签" title="内容标签" description="用于后续探索页与资料库页的关联推荐。" />
        <div class="playlist-view__tags">
          <span v-for="tag in currentPlaylist.tags" :key="tag" class="playlist-view__tag">{{ tag }}</span>
        </div>
      </UiSectionCard>
    </div>

    <UiSectionCard class="playlist-view__table">
      <MediaSectionTitle
        eyebrow="曲目表"
        title="歌单曲目"
        description="点击播放或喜欢按钮，会直接与底部播放器和当前会话状态联动。"
      />
      <TrackTable
        :tracks="trackRows"
        :liked-ids="player.likedTrackIdList"
        :active-track-id="activeTrackId"
        @play="playTrack"
        @toggle-like="toggleLike"
      />
    </UiSectionCard>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.playlist-view__meta-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.playlist-view__meta-copy {
  margin: 0;
  color: var(--color-text);
  font-size: 24px;
  font-weight: 700;
}

.playlist-view__meta-note {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.playlist-view__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.playlist-view__tag {
  padding: 8px 12px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
</style>
