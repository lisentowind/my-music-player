<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import MediaHeroCard from "@/components/music/MediaHeroCard.vue";
import MediaSectionTitle from "@/components/music/MediaSectionTitle.vue";
import MediaShelfCard from "@/components/music/MediaShelfCard.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import { useGsapHoverTargets, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import {
  auraDefaultPlaylist,
  auraDefaultPlaylistTracks,
  auraDiscoverAtmospheres,
  auraRecommendationPlaylists,
  auraTracks,
} from "@/data/aura-content";
import { usePlayerStore } from "@/stores/player";

const homeRef = ref<HTMLElement | null>(null);
const router = useRouter();
const player = usePlayerStore();

const currentTrackId = computed(() => player.currentTrack?.id ?? null);
const recentTracks = computed(() => player.recentPlayTracks.slice(0, 3));
const recentFallbackTracks = computed(() => recentTracks.value.length > 0 ? recentTracks.value : auraTracks.slice(0, 3));

const recommendationCards = computed(() => auraRecommendationPlaylists.map((playlist) => {
  const tracks = auraTracks.filter(track => playlist.trackIds.includes(track.id));
  return {
    ...playlist,
    leadTrackId: tracks[0]?.id ?? "",
    active: Boolean(currentTrackId.value && playlist.trackIds.includes(currentTrackId.value)),
    meta: `${playlist.statusLabel} · ${playlist.trackIds.length} 首曲目`,
  };
}));

const moodCards = computed(() => auraDiscoverAtmospheres.map((entry) => {
  const track = auraTracks.find(item => item.id === entry.trackId);
  return {
    ...entry,
    track,
  };
}).filter((entry): entry is typeof entry & { track: NonNullable<typeof entry.track> } => Boolean(entry.track)));

function playHeroPlaylist() {
  const firstTrackId = auraDefaultPlaylist.trackIds[0];
  if (!firstTrackId) {
    return;
  }

  void player.playContext(auraDefaultPlaylistTracks, firstTrackId);
}

function openPlaylist(playlistId: string) {
  void router.push({
    name: "playlist-detail",
    params: { playlistId },
  });
}

function playTrack(trackId: string) {
  void player.playTrackById(trackId);
}

useGsapReveal(homeRef, [".home-view__hero", ".home-view__recent", ".home-view__recommend", ".home-view__moods"], 0.08);
useGsapScrollReveal(homeRef, [
  {
    selector: ".home-view__recent-grid > *",
    triggerSelector: ".home-view__recent",
    y: 26,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: ".home-view__recommend-grid > *",
    triggerSelector: ".home-view__recommend",
    y: 32,
    scale: 0.98,
    stagger: 0.08,
  },
  {
    selector: ".home-view__moods-grid > *",
    triggerSelector: ".home-view__moods",
    y: 26,
    scale: 0.98,
    stagger: 0.06,
  },
]);
useGsapHoverTargets(homeRef, [".home-view__recommend-grid > *", ".home-view__moods-grid > *", ".home-view__recent-grid > *"], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section id="home-page" ref="homeRef" class="page home-view">
    <UiSectionCard class="home-view__hero" tone="contrast">
      <MediaHeroCard
        eyebrow="主打歌单"
        :title="auraDefaultPlaylist.title"
        :description="auraDefaultPlaylist.description"
        :cover-src="auraDefaultPlaylist.coverSrc"
        :meta-line="`${auraDefaultPlaylist.statusLabel} · ${auraDefaultPlaylist.trackIds.length} 首曲目`"
        secondary-label="查看歌单"
        primary-test-id="home-hero-play"
        @primary="playHeroPlaylist"
        @secondary="openPlaylist(auraDefaultPlaylist.id)"
      />
    </UiSectionCard>

    <UiSectionCard class="home-view__recent">
      <MediaSectionTitle
        eyebrow="继续接续"
        title="最近播放"
        :description="recentTracks.length > 0 ? '基于当前会话自动续播，点击卡片即可直接回到那首歌。' : '还没有最近播放，先从下面的精选卡片开始也可以。'"
      />
      <div class="home-view__recent-grid">
        <MediaShelfCard
          v-for="track in recentFallbackTracks"
          :key="track.id"
          compact
          eyebrow="最近接触"
          :title="track.title"
          :subtitle="track.artist"
          :meta="`${track.album} · ${track.durationLabel}`"
          :cover-src="track.coverSrc"
          :active="track.id === currentTrackId"
          icon="solar:play-bold"
          @select="playTrack(track.id)"
        />
      </div>
    </UiSectionCard>

    <UiSectionCard class="home-view__recommend">
      <MediaSectionTitle
        eyebrow="编辑推荐"
        title="推荐歌单"
        description="每张卡片都可以直接进入歌单详情，后续歌单页会沿用同一套内容数据和播放器上下文。"
      />
      <div class="home-view__recommend-grid">
        <MediaShelfCard
          v-for="playlist in recommendationCards"
          :key="playlist.id"
          :data-testid="`home-playlist-open-${playlist.id}`"
          eyebrow="推荐歌单"
          :title="playlist.title"
          :subtitle="playlist.subtitle"
          :meta="playlist.meta"
          :cover-src="playlist.coverSrc"
          :active="playlist.active"
          @select="openPlaylist(playlist.id)"
        />
      </div>
    </UiSectionCard>

    <UiSectionCard class="home-view__moods">
      <MediaSectionTitle
        eyebrow="情绪入口"
        title="情绪入口"
        description="把想听的氛围作为快捷入口，点击后会直接驱动播放器切歌。"
      />
      <div class="home-view__moods-grid">
        <MediaShelfCard
          v-for="(entry, index) in moodCards"
          :key="entry.id"
          compact
          :data-testid="`home-mood-card-${index}`"
          eyebrow="氛围卡片"
          :title="entry.title"
          :subtitle="entry.subtitle"
          :meta="`${entry.track.title} · ${entry.track.artist}`"
          :cover-src="entry.track.coverSrc"
          icon="solar:sun-outline"
          @select="playTrack(entry.track.id)"
        />
      </div>
    </UiSectionCard>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.home-view__recent-grid,
.home-view__moods-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.home-view__recommend-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
