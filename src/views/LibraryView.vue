<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import MediaHeroCard from "@/components/music/MediaHeroCard.vue";
import MediaSectionTitle from "@/components/music/MediaSectionTitle.vue";
import MediaShelfCard from "@/components/music/MediaShelfCard.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import { useGsapHoverTargets, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import { auraLibraryPlaylists, auraTracks, getAuraTracksByIds } from "@/data/aura-content";
import { usePlayerStore } from "@/stores/player";

const libraryRef = ref<HTMLElement | null>(null);
const router = useRouter();
const player = usePlayerStore();

const likedTrackSet = computed(() => new Set(player.likedTrackIdList));
const likedTracks = computed(() => auraTracks.filter(track => likedTrackSet.value.has(track.id)));
const libraryFallbackTracks = computed(() => getAuraTracksByIds(auraLibraryPlaylists[0]?.trackIds ?? []));
const focusQueue = computed(() => likedTracks.value.length > 0 ? likedTracks.value : libraryFallbackTracks.value);
const focusTrack = computed(() => focusQueue.value[0] ?? null);
const hasSessionProfile = computed(() => likedTracks.value.length > 0 || player.recentPlayTracks.length > 0);
const fallbackCoverSrc = computed(() => focusTrack.value?.coverSrc ?? auraLibraryPlaylists[0]?.coverSrc ?? auraTracks[0]?.coverSrc ?? "");
const artistNames = computed(() => Array.from(new Set([
  ...likedTracks.value.map(track => track.artist),
  ...player.recentPlayTracks.map(track => track.artist),
])).slice(0, 6));
const summaryCards = computed(() => [
  {
    label: "喜欢的歌曲",
    value: `${player.likedCount} 首`,
    detail: player.likedCount > 0 ? "与歌单页和底部播放器实时同步。" : "还没有收藏，先从主打歌单开始。",
  },
  {
    label: "最近播放",
    value: `${player.recentTrackCount} 首`,
    detail: player.recentTrackCount > 0 ? "你刚刚听过的内容会优先回到这里。" : "开始播放后会自动形成最近播放。",
  },
  {
    label: "偏好情绪",
    value: player.favoriteMoodTags[0] ?? "等待生成",
    detail: player.favoriteMoodTags.length > 0
      ? player.favoriteMoodTags.slice(0, 3).join(" · ")
      : "根据喜欢与最近播放自动聚合。",
  },
]);

function playFocusTrack() {
  if (!focusTrack.value || focusQueue.value.length <= 0) {
    return;
  }

  void player.playContext(focusQueue.value, focusTrack.value.id);
}

function openPlaylist(playlistId: string) {
  void router.push({
    name: "playlist-detail",
    params: { playlistId },
  });
}

useGsapReveal(libraryRef, [".library-view__hero", ".library-view__summary", ".library-view__playlists", ".library-view__artists"], 0.08);
useGsapScrollReveal(libraryRef, [
  {
    selector: ".library-view__summary-grid > *",
    triggerSelector: ".library-view__summary",
    y: 22,
    scale: 0.98,
    stagger: 0.05,
  },
  {
    selector: ".library-view__playlist-grid > *",
    triggerSelector: ".library-view__playlists",
    y: 24,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: ".library-view__artist-grid > *",
    triggerSelector: ".library-view__artists",
    y: 20,
    scale: 0.98,
    stagger: 0.05,
  },
]);
useGsapHoverTargets(libraryRef, [".library-view__summary-grid > *", ".library-view__playlist-grid > *", ".library-view__artist-grid > *"], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section id="library-page" ref="libraryRef" class="page library-view">
    <UiSectionCard class="library-view__hero" tone="contrast">
      <MediaHeroCard
        eyebrow="我的资料库"
        title="我喜欢的歌曲"
        :description="hasSessionProfile ? '把当前会话里喜欢的歌曲、资料库精选和常听艺人集中在一个页面里。' : '先播放一首歌，资料库会逐步形成你的个人轮廓。'"
        :cover-src="fallbackCoverSrc"
        :meta-line="`已收藏 · ${player.likedCount} 首`"
        primary-test-id="library-focus-play"
        @primary="playFocusTrack"
      />
    </UiSectionCard>

    <UiSectionCard class="library-view__summary">
      <MediaSectionTitle
        eyebrow="资料库小卡片"
        title="会话概览"
        description="把收藏、最近播放和偏好情绪收进三张小卡片，帮助你快速判断当前资料库状态。"
      />
      <div class="library-view__summary-grid">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="library-view__summary-card"
        >
          <p class="library-view__summary-label">{{ card.label }}</p>
          <p class="library-view__summary-value">{{ card.value }}</p>
          <p class="library-view__summary-detail">{{ card.detail }}</p>
        </article>
      </div>
    </UiSectionCard>

    <UiSectionCard class="library-view__playlists">
      <MediaSectionTitle
        eyebrow="资料库精选"
        title="资料库精选"
        description="把偏工作、偏夜晚和偏收藏的几组内容重新编排成随时可取的资料块。"
      />
      <div class="library-view__playlist-grid">
        <MediaShelfCard
          v-for="playlist in auraLibraryPlaylists"
          :key="playlist.id"
          :data-testid="`library-playlist-open-${playlist.id}`"
          eyebrow="资料库精选"
          :title="playlist.title"
          :subtitle="playlist.subtitle"
          :meta="`${playlist.statusLabel} · ${playlist.trackIds.length} 首曲目`"
          :cover-src="playlist.coverSrc"
          @select="openPlaylist(playlist.id)"
        />
      </div>
    </UiSectionCard>

    <UiSectionCard class="library-view__artists">
      <MediaSectionTitle
        eyebrow="常听艺人"
        title="常听艺人"
        description="根据当前喜欢内容和最近播放轻量聚合，不做额外持久化。"
      />
      <div v-if="artistNames.length > 0" class="library-view__artist-grid">
        <article v-for="artist in artistNames" :key="artist" class="library-view__artist-card">
          <p class="library-view__artist-name">{{ artist }}</p>
          <p class="library-view__artist-meta">来自当前会话收藏与最近播放</p>
        </article>
      </div>
      <p v-else class="library-view__artist-empty">等你开始播放后，这里会出现常听艺人。</p>
    </UiSectionCard>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.library-view__summary-grid,
.library-view__playlist-grid,
.library-view__artist-grid {
  display: grid;
  gap: 18px;
}

.library-view__summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.library-view__playlist-grid,
.library-view__artist-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.library-view__summary-card,
.library-view__artist-card {
  padding: 18px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-control-surface) 94%, transparent);
}

.library-view__summary-label {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.library-view__summary-value {
  margin: 14px 0 0;
  color: var(--color-text);
  font-size: 28px;
  font-weight: 700;
}

.library-view__summary-detail {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.library-view__artist-name {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
  font-weight: 600;
}

.library-view__artist-meta {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.library-view__artist-empty {
  margin: 0;
  padding: 18px;
  border: 1px dashed var(--color-state-border-subtle);
  border-radius: 22px;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
