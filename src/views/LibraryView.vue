<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { iconRegistry } from "@/components/ui/icon-registry";
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
const artistProfiles = computed(() => artistNames.value.map((artist, index) => {
  const sourceTrack = [...likedTracks.value, ...player.recentPlayTracks, ...auraTracks]
    .find(track => track.artist === artist);
  return {
    artist,
    coverSrc: sourceTrack?.coverSrc ?? auraTracks[index % auraTracks.length]?.coverSrc ?? "",
  };
}));
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

useGsapReveal(libraryRef, [
  ".library-view__hero",
  ".library-view__summary",
  ".library-view__playlists",
  ".library-view__artists",
], 0.08);
useGsapScrollReveal(libraryRef, [
  {
    selector: ".library-view__hero-side > *",
    triggerSelector: ".library-view__hero",
    y: 24,
    scale: 0.98,
    stagger: 0.05,
  },
  {
    selector: ".library-view__summary-grid > *",
    triggerSelector: ".library-view__summary",
    y: 20,
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
    y: 22,
    scale: 0.98,
    stagger: 0.04,
  },
]);
useGsapHoverTargets(libraryRef, [
  ".library-view__focus-card",
  ".library-view__hero-side > *",
  ".library-view__summary-grid > *",
  ".library-view__playlist-grid > *",
  ".library-view__artist-grid > *",
], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section
    id="library-page"
    ref="libraryRef"
    class="page library-view library-view--stitch"
    data-library-visual="stitch-library"
  >
    <div class="library-view__ambient library-view__ambient--violet" aria-hidden="true" />
    <div class="library-view__ambient library-view__ambient--mint" aria-hidden="true" />

    <section class="library-view__hero">
      <article class="library-view__focus-card">
        <img class="library-view__focus-image" :src="fallbackCoverSrc" :alt="focusTrack ? `${focusTrack.title} 封面` : '资料库主封面'">
        <span class="library-view__focus-shade" aria-hidden="true" />
        <div class="library-view__focus-copy">
          <p class="library-view__eyebrow">我的资料库</p>
          <h1 class="library-view__focus-title">我喜欢的歌曲</h1>
          <p class="library-view__focus-description">
            {{ hasSessionProfile ? "把当前会话里喜欢的歌曲、资料库精选和常听艺人集中成一个更像 Stitch 的收藏首页。" : "先播放一首歌，资料库会逐步形成你的个人轮廓。" }}
          </p>
          <div class="library-view__focus-meta flex items-center gap-3">
            <span class="library-view__focus-chip">{{ `已收藏 · ${player.likedCount} 首` }}</span>
            <span class="library-view__focus-chip">{{ `最近播放 · ${player.recentTrackCount} 首` }}</span>
          </div>
          <div class="library-view__focus-actions flex items-center gap-3">
            <button
              data-testid="library-focus-play"
              type="button"
              class="library-view__play-button"
              @click="playFocusTrack"
            >
              <Icon :icon="iconRegistry['solar:play-bold']" />
              <span>播放收藏焦点</span>
            </button>
          </div>
        </div>
      </article>

      <div class="library-view__hero-side">
        <button
          v-for="playlist in auraLibraryPlaylists"
          :key="playlist.id"
          :data-testid="`library-playlist-open-${playlist.id}`"
          type="button"
          class="library-view__library-card"
          @click="openPlaylist(playlist.id)"
        >
          <img class="library-view__library-image" :src="playlist.coverSrc" :alt="`${playlist.title} 封面`">
          <div class="library-view__library-copy">
            <p class="library-view__eyebrow">{{ playlist.subtitle }}</p>
            <h2 class="library-view__library-title">{{ playlist.title }}</h2>
            <p class="library-view__library-meta">{{ `${playlist.statusLabel} · ${playlist.trackIds.length} 首曲目` }}</p>
          </div>
        </button>
      </div>
    </section>

    <section class="library-view__panel library-view__summary">
      <header class="library-view__section-head">
        <div>
          <p class="library-view__eyebrow">资料库小卡片</p>
          <h2 class="library-view__section-title">会话概览</h2>
          <p class="library-view__section-copy">保留你原本要的会话联动信息，但排版改成更靠近 Stitch 的深色卡组。</p>
        </div>
      </header>

      <div class="library-view__summary-grid">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="library-view__summary-card"
        >
          <p class="library-view__summary-label">{{ card.label }}</p>
          <h3 class="library-view__summary-value">{{ card.value }}</h3>
          <p class="library-view__summary-detail">{{ card.detail }}</p>
        </article>
      </div>
    </section>

    <section class="library-view__panel library-view__playlists">
      <header class="library-view__section-head">
        <div>
          <p class="library-view__eyebrow">资料库精选</p>
          <h2 class="library-view__section-title">资料库精选</h2>
          <p class="library-view__section-copy">把资料库里的两组主卡做成更强封面视觉，和底部播放器栏的重玻璃质感统一起来。</p>
        </div>
      </header>

      <div class="library-view__playlist-grid">
        <button
          v-for="playlist in auraLibraryPlaylists"
          :key="`featured-${playlist.id}`"
          type="button"
          class="library-view__playlist-card"
          @click="openPlaylist(playlist.id)"
        >
          <img class="library-view__playlist-image" :src="playlist.coverSrc" :alt="`${playlist.title} 封面`">
          <span class="library-view__playlist-shade" aria-hidden="true" />
          <div class="library-view__playlist-copy">
            <p class="library-view__playlist-badge">{{ playlist.statusLabel }}</p>
            <h3 class="library-view__playlist-title">{{ playlist.title }}</h3>
            <p class="library-view__playlist-description">{{ playlist.description }}</p>
          </div>
        </button>
      </div>
    </section>

    <section class="library-view__panel library-view__artists">
      <header class="library-view__section-head">
        <div>
          <p class="library-view__eyebrow">常听艺人</p>
          <h2 class="library-view__section-title">常听艺人</h2>
          <p class="library-view__section-copy">根据当前喜欢内容和最近播放轻量聚合，不额外持久化，但视觉上更像资料库页的尾部人物墙。</p>
        </div>
      </header>

      <div v-if="artistProfiles.length > 0" class="library-view__artist-grid">
        <article v-for="profile in artistProfiles" :key="profile.artist" class="library-view__artist-card">
          <img class="library-view__artist-avatar" :src="profile.coverSrc" :alt="`${profile.artist} 视觉图`">
          <p class="library-view__artist-name">{{ profile.artist }}</p>
          <p class="library-view__artist-meta">来自当前会话收藏与最近播放</p>
        </article>
      </div>
      <p v-else class="library-view__artist-empty">等你开始播放后，这里会出现常听艺人。</p>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: 18px;
}

.library-view {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.library-view--stitch {
  padding: clamp(10px, 1.3vw, 14px);
  border-radius: 22px;
  background:
    radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 36%),
    radial-gradient(circle at 90% 18%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 32%),
    linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 74%, transparent);
}

.library-view__ambient {
  position: absolute;
  z-index: -1;
  width: clamp(240px, 34vw, 420px);
  aspect-ratio: 1;
  border-radius: 999px;
  filter: blur(92px);
  opacity: 0.54;
  pointer-events: none;
}

.library-view__ambient--violet {
  top: -160px;
  left: -20px;
  background: color-mix(in srgb, var(--color-accent) 56%, transparent);
}

.library-view__ambient--mint {
  right: 2%;
  bottom: -170px;
  background: color-mix(in srgb, var(--color-accent) 22%, var(--color-bg-elevated) 78%);
}

.library-view__hero,
.library-view__panel {
  position: relative;
  z-index: 1;
}

.library-view__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
  gap: 12px;
}

.library-view__focus-card,
.library-view__library-card,
.library-view__panel,
.library-view__summary-card,
.library-view__playlist-card,
.library-view__artist-card,
.library-view__artist-empty {
  border: 0;
  background:
    linear-gradient(145deg, var(--color-panel-glow-start), transparent 44%),
    var(--color-panel-fill);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-border) 92%, transparent),
    inset 0 1px 0 var(--color-panel-glow-end),
    0 24px 60px var(--color-popover-shadow);
  backdrop-filter: blur(24px);
}

.library-view__focus-card {
  position: relative;
  overflow: hidden;
  min-height: 332px;
  border-radius: 20px;
}

.library-view__focus-image,
.library-view__focus-shade {
  position: absolute;
  inset: 0;
}

.library-view__focus-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.03);
  transition: transform 520ms ease;
}

.library-view__focus-card:hover .library-view__focus-image {
  transform: scale(1.08);
}

.library-view__focus-shade {
  background:
    linear-gradient(95deg, rgba(0, 0, 0, 0.92) 8%, rgba(0, 0, 0, 0.56) 48%, rgba(0, 0, 0, 0.2) 100%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.54) 100%);
}

.library-view__focus-copy {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  gap: 0;
  min-height: 332px;
  max-width: 620px;
  padding: clamp(18px, 2vw, 24px);
}

.library-view__eyebrow,
.library-view__summary-label,
.library-view__playlist-badge {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.library-view__focus-title {
  margin: 14px 0 0;
  color: color-mix(in srgb, white 94%, var(--color-accent) 6%);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(36px, 4.4vw, 54px);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.library-view__focus-description {
  max-width: 560px;
  margin: 14px 0 0;
  color: color-mix(in srgb, white 76%, var(--color-accent) 24%);
  font-size: 12px;
  line-height: 1.54;
}

.library-view__focus-meta {
  margin-top: 14px;
  flex-wrap: wrap;
}

.library-view__focus-chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, white 12%, transparent);
  color: color-mix(in srgb, white 88%, var(--color-accent) 12%);
  font-size: 11px;
}

.library-view__focus-actions {
  margin-top: 18px;
  flex-wrap: wrap;
}

.library-view__play-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  font-size: 12px;
  font-weight: 700;
  box-shadow: var(--shadow-primary-hover);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.library-view__play-button:hover {
  transform: translateY(-2px);
}

.library-view__play-button svg,
.library-view__artist-avatar svg {
  width: 18px;
  height: 18px;
}

.library-view__hero-side {
  display: grid;
  gap: 12px;
}

.library-view__library-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  min-height: 154px;
  padding: 12px;
  border-radius: 18px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.library-view__library-card:hover,
.library-view__summary-card:hover,
.library-view__playlist-card:hover,
.library-view__artist-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-state-border-emphasis);
  box-shadow: 0 22px 46px var(--color-popover-shadow);
}

.library-view__library-image {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
}

.library-view__library-copy {
  align-self: end;
}

.library-view__library-title,
.library-view__section-title,
.library-view__summary-value,
.library-view__playlist-title {
  margin: 10px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  line-height: 1.04;
  letter-spacing: -0.04em;
}

.library-view__library-title {
  font-size: clamp(20px, 2.2vw, 24px);
}

.library-view__library-meta,
.library-view__section-copy,
.library-view__summary-detail,
.library-view__artist-meta,
.library-view__playlist-description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.library-view__panel {
  border-radius: 20px;
  padding: clamp(14px, 1.8vw, 20px);
}

.library-view__section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.library-view__section-title {
  font-size: clamp(20px, 2.7vw, 26px);
}

.library-view__summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.library-view__summary-card {
  padding: 14px;
  border-radius: 16px;
}

.library-view__summary-value {
  font-size: clamp(20px, 2vw, 26px);
}

.library-view__playlist-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.library-view__playlist-card {
  position: relative;
  overflow: hidden;
  min-height: 228px;
  padding: 0;
  border-radius: 18px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}

.library-view__playlist-image,
.library-view__playlist-shade {
  position: absolute;
  inset: 0;
}

.library-view__playlist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 420ms ease;
}

.library-view__playlist-card:hover .library-view__playlist-image {
  transform: scale(1.06);
}

.library-view__playlist-shade {
  background: linear-gradient(180deg, rgba(8, 8, 8, 0.12), rgba(8, 8, 8, 0.82) 70%, rgba(8, 8, 8, 0.94) 100%);
}

.library-view__playlist-copy {
  position: absolute;
  inset: auto 0 0;
  z-index: 1;
  padding: 12px;
}

.library-view__playlist-badge {
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, white 14%, transparent);
  color: color-mix(in srgb, white 92%, var(--color-accent) 8%);
}

.library-view__playlist-title {
  font-size: clamp(20px, 2.3vw, 24px);
  color: color-mix(in srgb, white 94%, var(--color-accent) 6%);
}

.library-view__playlist-description {
  color: color-mix(in srgb, white 78%, var(--color-accent) 22%);
}

.library-view__artist-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.library-view__artist-card {
  display: grid;
  justify-items: center;
  padding: 14px;
  border-radius: 16px;
  text-align: center;
}

.library-view__artist-avatar {
  width: 76px;
  height: 76px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  box-shadow: 0 14px 28px var(--color-popover-shadow);
}

.library-view__artist-name {
  margin: 14px 0 0;
  color: var(--color-text-strong);
  font-size: 15px;
  font-weight: 700;
}

.library-view__artist-empty {
  margin: 0;
  padding: 16px;
  border-radius: 18px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

@media (max-width: 1480px) {
  .library-view__hero {
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.9fr);
  }

  .library-view__artist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .library-view__hero,
  .library-view__summary-grid,
  .library-view__playlist-grid,
  .library-view__artist-grid {
    grid-template-columns: 1fr;
  }
}
</style>
