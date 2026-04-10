<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { iconRegistry } from "@/components/ui/icon-registry";
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
const trendingTracks = computed(() => {
  const seed = player.recentPlayTracks.length > 0 ? player.recentPlayTracks : auraTracks;
  return seed.slice(0, 4);
});
const heroMetrics = computed(() => [
  {
    label: "本周主推",
    value: auraDefaultPlaylist.statusLabel,
    detail: `${auraDefaultPlaylist.trackIds.length} 首曲目已经接入统一播放器队列。`,
  },
  {
    label: "当前会话",
    value: player.currentTrack?.title ?? "等待点亮",
    detail: player.currentTrack ? `${player.currentTrack.artist} · ${player.activeModeLabel}` : "从首页任一入口播放后，底部播放器栏会立即同步。",
  },
  {
    label: "情绪标签",
    value: player.favoriteMoodTags[0] ?? auraTracks[0]?.moods[0] ?? "冷调",
    detail: player.favoriteMoodTags.length > 0 ? player.favoriteMoodTags.slice(0, 3).join(" · ") : "根据最近播放与收藏自动汇聚。",
  },
]);

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

useGsapReveal(homeRef, [
  ".home-view__hero",
  ".home-view__continue",
  ".home-view__recommend",
  ".home-view__moods",
], 0.08);
useGsapScrollReveal(homeRef, [
  {
    selector: ".home-view__hero-side > *",
    triggerSelector: ".home-view__hero",
    y: 24,
    scale: 0.98,
    stagger: 0.05,
  },
  {
    selector: ".home-view__continue-grid > *",
    triggerSelector: ".home-view__continue",
    y: 24,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: ".home-view__recommend-grid > *",
    triggerSelector: ".home-view__recommend",
    y: 26,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: ".home-view__moods-grid > *",
    triggerSelector: ".home-view__moods",
    y: 22,
    scale: 0.98,
    stagger: 0.05,
  },
]);
useGsapHoverTargets(homeRef, [
  ".home-view__hero-main",
  ".home-view__hero-metric",
  ".home-view__continue-grid > *",
  ".home-view__recommend-grid > *",
  ".home-view__moods-grid > *",
], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section
    id="home-page"
    ref="homeRef"
    class="page home-view home-view--stitch"
    data-home-visual="stitch-editorial"
  >
    <div class="home-view__ambient home-view__ambient--violet" aria-hidden="true" />
    <div class="home-view__ambient home-view__ambient--rose" aria-hidden="true" />

    <section class="home-view__hero">
      <article class="home-view__hero-main">
        <img class="home-view__hero-image" :src="auraDefaultPlaylist.coverSrc" :alt="`${auraDefaultPlaylist.title} 封面`">
        <div class="home-view__hero-shade" aria-hidden="true" />
        <div class="home-view__hero-copy">
          <p class="home-view__eyebrow">首页主打</p>
          <h1 class="home-view__hero-title">{{ auraDefaultPlaylist.title }}</h1>
          <p class="home-view__hero-description">{{ auraDefaultPlaylist.description }}</p>
          <div class="home-view__hero-meta flex items-center gap-3">
            <span class="home-view__hero-chip">{{ auraDefaultPlaylist.statusLabel }}</span>
            <span class="home-view__hero-chip">{{ `${auraDefaultPlaylist.trackIds.length} 首曲目` }}</span>
          </div>
          <div class="home-view__hero-actions flex items-center gap-3">
            <button
              data-testid="home-hero-play"
              type="button"
              class="home-view__hero-button home-view__hero-button--primary"
              @click="playHeroPlaylist"
            >
              <Icon :icon="iconRegistry['solar:play-bold']" />
              <span>立即播放</span>
            </button>
            <button
              type="button"
              class="home-view__hero-button home-view__hero-button--ghost"
              @click="openPlaylist(auraDefaultPlaylist.id)"
            >
              <span>查看歌单</span>
            </button>
          </div>
        </div>
      </article>

      <aside class="home-view__hero-side">
        <article
          v-for="metric in heroMetrics"
          :key="metric.label"
          class="home-view__hero-metric"
        >
          <p class="home-view__metric-label">{{ metric.label }}</p>
          <h2 class="home-view__metric-value">{{ metric.value }}</h2>
          <p class="home-view__metric-detail">{{ metric.detail }}</p>
        </article>
      </aside>
    </section>

    <section class="home-view__panel home-view__continue">
      <header class="home-view__section-head">
        <div>
          <p class="home-view__eyebrow">继续接续</p>
          <h2 class="home-view__section-title">最近播放</h2>
          <p class="home-view__section-copy">
            {{ recentTracks.length > 0 ? "把刚刚听过的三首歌继续接上，维持同一段情绪。" : "还没有最近播放，先从主打区或推荐区点亮第一首歌。" }}
          </p>
        </div>
        <div class="home-view__section-chip">
          <Icon :icon="iconRegistry['solar:clock-circle-outline']" />
          <span>{{ `${recentFallbackTracks.length} 条入口` }}</span>
        </div>
      </header>

      <div class="home-view__continue-layout">
        <div class="home-view__continue-grid">
          <button
            v-for="track in recentFallbackTracks"
            :key="track.id"
            type="button"
            class="home-view__continue-card"
            :class="{ 'is-active': track.id === currentTrackId }"
            @click="playTrack(track.id)"
          >
            <img class="home-view__continue-image" :src="track.coverSrc" :alt="`${track.title} 封面`">
            <div class="home-view__continue-copy">
              <p class="home-view__card-eyebrow">最近播放</p>
              <h3 class="home-view__card-title">{{ track.title }}</h3>
              <p class="home-view__card-subtitle">{{ `${track.artist} · ${track.album}` }}</p>
              <p class="home-view__card-meta">{{ `${track.durationLabel} · ${track.moods.slice(0, 2).join(" · ")}` }}</p>
            </div>
            <span class="home-view__card-play" aria-hidden="true">
              <Icon :icon="iconRegistry['solar:play-bold']" />
            </span>
          </button>
        </div>

        <aside class="home-view__trend-panel">
          <div class="home-view__trend-head">
            <p class="home-view__card-eyebrow">热度排行</p>
            <h3 class="home-view__trend-title">热门榜单</h3>
          </div>

          <button
            v-for="(track, index) in trendingTracks"
            :key="`trend-${track.id}`"
            type="button"
            class="home-view__trend-item"
            @click="playTrack(track.id)"
          >
            <span class="home-view__trend-rank">{{ String(index + 1).padStart(2, "0") }}</span>
            <img class="home-view__trend-image" :src="track.coverSrc" :alt="`${track.title} 封面`">
            <span class="home-view__trend-copy">
              <strong>{{ track.title }}</strong>
              <small>{{ track.artist }}</small>
            </span>
            <span class="home-view__trend-time">{{ track.durationLabel }}</span>
          </button>
        </aside>
      </div>
    </section>

    <section class="home-view__panel home-view__recommend">
      <header class="home-view__section-head">
        <div>
          <p class="home-view__eyebrow">编辑推荐</p>
          <h2 class="home-view__section-title">推荐歌单</h2>
          <p class="home-view__section-copy">按照 Stitch 参考图的大片封面逻辑，把推荐区做成更强的封面导向和暗色杂志排版。</p>
        </div>
      </header>

      <div class="home-view__recommend-grid">
        <button
          v-for="playlist in recommendationCards"
          :key="playlist.id"
          :data-testid="`home-playlist-open-${playlist.id}`"
          type="button"
          class="home-view__poster-card"
          :class="{ 'is-active': playlist.active }"
          @click="openPlaylist(playlist.id)"
        >
          <img class="home-view__poster-image" :src="playlist.coverSrc" :alt="`${playlist.title} 封面`">
          <span class="home-view__poster-shade" aria-hidden="true" />
          <div class="home-view__poster-copy">
            <p class="home-view__poster-badge">{{ playlist.subtitle }}</p>
            <h3 class="home-view__poster-title">{{ playlist.title }}</h3>
            <p class="home-view__poster-meta">{{ playlist.meta }}</p>
          </div>
        </button>
      </div>
    </section>

    <section class="home-view__panel home-view__moods">
      <header class="home-view__section-head">
        <div>
          <p class="home-view__eyebrow">情绪入口</p>
          <h2 class="home-view__section-title">情绪入口</h2>
          <p class="home-view__section-copy">把常用氛围做成更轻更快的入口卡，悬停时会抬起，点击后直接驱动播放器切歌。</p>
        </div>
      </header>

      <div class="home-view__moods-grid">
        <button
          v-for="(entry, index) in moodCards"
          :key="entry.id"
          :data-testid="`home-mood-card-${index}`"
          type="button"
          class="home-view__mood-card"
          @click="playTrack(entry.track.id)"
        >
          <div class="home-view__mood-copy">
            <p class="home-view__card-eyebrow">氛围入口</p>
            <h3 class="home-view__card-title">{{ entry.title }}</h3>
            <p class="home-view__card-subtitle">{{ entry.subtitle }}</p>
            <p class="home-view__card-meta">{{ `${entry.track.title} · ${entry.track.artist}` }}</p>
          </div>
          <img class="home-view__mood-image" :src="entry.track.coverSrc" :alt="`${entry.track.title} 封面`">
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: 18px;
}

.home-view {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.home-view--stitch {
  padding: clamp(10px, 1.3vw, 14px);
  border-radius: 22px;
  background:
    radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent 34%),
    radial-gradient(circle at 88% 20%, color-mix(in srgb, #ff7b97 16%, transparent), transparent 30%),
    linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg));
  border: 1px solid var(--color-border);
}

.home-view__ambient {
  position: absolute;
  z-index: -1;
  width: clamp(260px, 34vw, 420px);
  aspect-ratio: 1;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.58;
  pointer-events: none;
}

.home-view__ambient--violet {
  top: -170px;
  right: 2%;
  background: rgba(173, 129, 255, 0.54);
}

.home-view__ambient--rose {
  bottom: -180px;
  left: 0;
  background: rgba(255, 120, 146, 0.24);
}

.home-view__hero,
.home-view__panel {
  position: relative;
  z-index: 1;
}

.home-view__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.9fr);
  gap: 12px;
}

.home-view__hero-main,
.home-view__hero-metric,
.home-view__panel,
.home-view__continue-card,
.home-view__poster-card,
.home-view__mood-card {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(145deg, var(--color-panel-glow-start), transparent 40%),
    var(--color-panel-fill);
  box-shadow: inset 0 1px 0 var(--color-panel-glow-end), 0 24px 60px var(--color-popover-shadow);
  backdrop-filter: blur(24px);
}

.home-view__hero-main {
  position: relative;
  overflow: hidden;
  min-height: 332px;
  border-radius: 20px;
}

.home-view__hero-image,
.home-view__hero-shade {
  position: absolute;
  inset: 0;
}

.home-view__hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.03);
  transition: transform 520ms ease;
}

.home-view__hero-main:hover .home-view__hero-image {
  transform: scale(1.08);
}

.home-view__hero-shade {
  background:
    linear-gradient(92deg, rgba(0, 0, 0, 0.92) 6%, rgba(0, 0, 0, 0.56) 48%, rgba(0, 0, 0, 0.22) 100%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
}

.home-view__hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  gap: 0;
  min-height: 332px;
  max-width: 620px;
  padding: clamp(18px, 2vw, 24px);
}

.home-view__eyebrow,
.home-view__card-eyebrow,
.home-view__metric-label {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-view__hero-title {
  margin: 14px 0 0;
  color: color-mix(in srgb, white 94%, var(--color-accent) 6%);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(36px, 4.4vw, 56px);
  line-height: 0.96;
  letter-spacing: -0.06em;
}

.home-view__hero-description {
  max-width: 520px;
  margin: 12px 0 0;
  color: color-mix(in srgb, white 76%, var(--color-accent) 24%);
  font-size: 12px;
  line-height: 1.56;
}

.home-view__hero-meta {
  margin-top: 14px;
  flex-wrap: wrap;
}

.home-view__hero-chip,
.home-view__section-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, white 12%, transparent);
  color: color-mix(in srgb, white 88%, var(--color-accent) 12%);
  font-size: 11px;
}

.home-view__hero-actions {
  margin-top: 18px;
  flex-wrap: wrap;
}

.home-view__hero-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
}

.home-view__hero-button svg,
.home-view__section-chip svg,
.home-view__card-play svg {
  width: 18px;
  height: 18px;
}

.home-view__hero-button--primary {
  border: none;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  box-shadow: var(--shadow-primary-hover);
}

.home-view__hero-button--primary:hover {
  transform: translateY(-2px);
}

.home-view__hero-button--ghost {
  border: 1px solid color-mix(in srgb, white 18%, transparent);
  background: color-mix(in srgb, white 8%, transparent);
  color: color-mix(in srgb, white 92%, var(--color-accent) 8%);
}

.home-view__hero-button--ghost:hover {
  transform: translateY(-2px);
  background: color-mix(in srgb, white 12%, transparent);
}

.home-view__hero-side {
  display: grid;
  gap: 12px;
}

.home-view__hero-metric {
  display: grid;
  align-content: end;
  min-height: 98px;
  padding: 16px;
  border-radius: 18px;
}

.home-view__metric-value {
  margin: 12px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(20px, 2.2vw, 26px);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.home-view__metric-detail {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.home-view__panel {
  border-radius: 20px;
  padding: clamp(14px, 1.8vw, 20px);
}

.home-view__section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.home-view__section-title {
  margin: 10px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(20px, 2.7vw, 26px);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.home-view__section-copy {
  max-width: 720px;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.home-view__continue-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.9fr);
  gap: 12px;
}

.home-view__continue-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.home-view__continue-card {
  position: relative;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 98px;
  padding: 12px;
  border-radius: 18px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.home-view__trend-panel {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background:
    linear-gradient(145deg, var(--color-panel-glow-start), transparent 40%),
    var(--color-panel-fill);
}

.home-view__trend-head {
  margin-bottom: 4px;
}

.home-view__trend-title {
  margin: 10px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 20px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.home-view__trend-item {
  display: grid;
  grid-template-columns: 28px 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 0;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease, background 180ms ease;
}

.home-view__trend-item:hover {
  transform: translateX(2px);
  background: var(--color-control-surface);
}

.home-view__trend-rank,
.home-view__trend-time {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.home-view__trend-image {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  object-fit: cover;
}

.home-view__trend-copy {
  display: grid;
  min-width: 0;
}

.home-view__trend-copy strong,
.home-view__trend-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-view__trend-copy strong {
  color: var(--color-text-strong);
  font-size: 14px;
}

.home-view__trend-copy small {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.home-view__continue-card:hover,
.home-view__continue-card.is-active,
.home-view__poster-card:hover,
.home-view__poster-card.is-active,
.home-view__mood-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-state-border-emphasis);
  box-shadow: 0 22px 44px var(--color-popover-shadow);
}

.home-view__continue-image,
.home-view__mood-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-view__continue-image {
  border-radius: 18px;
  aspect-ratio: 1;
}

.home-view__continue-copy,
.home-view__mood-copy {
  min-width: 0;
}

.home-view__card-title,
.home-view__poster-title {
  margin: 10px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  line-height: 1.04;
  letter-spacing: -0.03em;
}

.home-view__card-title {
  font-size: 18px;
}

.home-view__card-subtitle,
.home-view__card-meta,
.home-view__poster-meta {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.home-view__card-play {
  position: absolute;
  right: 14px;
  bottom: 14px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  box-shadow: var(--shadow-primary-active);
}

.home-view__recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.home-view__poster-card {
  position: relative;
  overflow: hidden;
  min-height: 280px;
  padding: 0;
  border-radius: 24px;
  cursor: pointer;
  text-align: left;
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.home-view__poster-image,
.home-view__poster-shade {
  position: absolute;
  inset: 0;
}

.home-view__poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 420ms ease;
}

.home-view__poster-card:hover .home-view__poster-image {
  transform: scale(1.06);
}

.home-view__poster-shade {
  background: linear-gradient(180deg, rgba(8, 8, 8, 0.08), rgba(8, 8, 8, 0.82) 72%, rgba(8, 8, 8, 0.94) 100%);
}

.home-view__poster-copy {
  position: absolute;
  inset: auto 0 0;
  z-index: 1;
  padding: 14px;
}

.home-view__poster-badge {
  display: inline-flex;
  width: fit-content;
  margin: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, white 14%, transparent);
  color: color-mix(in srgb, white 92%, var(--color-accent) 8%);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.home-view__poster-title {
  font-size: clamp(22px, 2.6vw, 30px);
  color: color-mix(in srgb, white 94%, var(--color-accent) 6%);
}

.home-view__poster-meta {
  color: color-mix(in srgb, white 76%, var(--color-accent) 24%);
}

.home-view__moods-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.home-view__mood-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 140px;
  padding: 14px;
  border-radius: 20px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.home-view__mood-image {
  aspect-ratio: 1;
  border-radius: 14px;
}

@media (max-width: 1480px) {
  .home-view__hero {
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  }

  .home-view__recommend-grid,
  .home-view__moods-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .home-view__hero,
  .home-view__continue-layout {
    grid-template-columns: 1fr;
  }
}
</style>
