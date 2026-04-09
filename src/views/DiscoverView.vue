<script setup lang="ts">
import { computed, ref } from "vue";
import AlbumCard from "@/components/music/AlbumCard.vue";
import RecentPlayList from "@/components/music/RecentPlayList.vue";
import SectionHeader from "@/components/music/SectionHeader.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import {
  useGsapHoverTargets,
  useGsapReveal,
  useGsapScrollReveal,
} from "@/composables/use-gsap";
import {
  discoverAtmospheres,
  featuredAlbums,
  getTracksByIds,
  tracks,
} from "@/data/music-library";
import { profileSeed } from "@/data/profile";
import { usePlayerStore } from "@/stores/player";

const discoverRef = ref<HTMLElement | null>(null);
const player = usePlayerStore();

const currentTrackId = computed(() => player.currentTrack?.id ?? null);
const likedSet = computed(() => new Set(player.likedTrackIdList));
const queueCount = computed(() => tracks.length);
const likedCount = computed(() => player.likedCount);

const featuredItems = computed(() => featuredAlbums.map((album) => {
  const albumTracks = getTracksByIds(album.trackIds);
  const leadTrackId = albumTracks[0]?.id ?? null;

  return {
    album,
    albumTracks,
    leadTrackId,
    active: Boolean(currentTrackId.value && album.trackIds.includes(currentTrackId.value)),
  };
}));

const quickPicks = computed(() => profileSeed.quickPicks
  .map((pick) => {
    const track = tracks.find(item => item.id === pick.trackId);
    if (!track) {
      return null;
    }

    return {
      ...pick,
      track,
    };
  })
  .filter((pick): pick is NonNullable<typeof pick> => Boolean(pick)));

const atmosphereCards = computed(() => discoverAtmospheres
  .map((card) => {
    const track = tracks.find(item => item.id === card.trackId);
    if (!track) {
      return null;
    }

    return {
      ...card,
      track,
    };
  })
  .filter((card): card is NonNullable<typeof card> => Boolean(card)));

const recentTracks = computed(() => getTracksByIds(player.recentPlayIds));

function playFeaturedAlbum(albumId: string) {
  const target = featuredItems.value.find(item => item.album.id === albumId);
  if (!target || !target.leadTrackId) {
    return;
  }

  void player.playContext(target.albumTracks, target.leadTrackId);
}

function playTrack(trackId: string) {
  void player.playTrackById(trackId);
}

function toggleLike(trackId: string) {
  player.toggleLike(trackId);
}

useGsapReveal(
  discoverRef,
  [
    ".discover-view__hero-grid > *",
  ],
  0.06,
);

useGsapScrollReveal(discoverRef, [
  {
    selector: "#discover-featured-albums .discover-view__album-entry",
    triggerSelector: "#discover-featured-albums",
    y: 34,
    scale: 0.97,
    stagger: 0.08,
  },
  {
    selector: "#discover-quick-picks .discover-view__quick-card",
    triggerSelector: "#discover-quick-picks",
    y: 26,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: "#discover-atmosphere .discover-view__atmosphere-card",
    triggerSelector: "#discover-atmosphere",
    y: 24,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: "#discover-recent-plays .recent-play-list__item",
    triggerSelector: "#discover-recent-plays",
    y: 22,
    scale: 0.99,
    stagger: 0.04,
  },
]);

useGsapHoverTargets(discoverRef, [
  ".discover-view__quick-card",
  ".discover-view__atmosphere-card",
], {
  hoverY: -4,
  hoverScale: 1.012,
  pressScale: 0.985,
  duration: 0.22,
});
</script>

<template>
  <section id="discover-page" ref="discoverRef" class="page discover-view">
    <section id="discover-hero" class="discover-view__hero-grid">
      <UiSectionCard class="block" tone="contrast">
        <p class="discover-view__eyebrow">今日推荐</p>
        <h2>欢迎回来，林雾</h2>
        <p>继续沉浸在偏好的清透声场里，从精选专辑、情境入口到最近播放一键接续。</p>
        <div class="discover-view__hero-stats">
          <div>
            <strong>{{ queueCount }}</strong>
            <span>曲库总量</span>
          </div>
          <div>
            <strong>{{ likedCount }}</strong>
            <span>已喜欢</span>
          </div>
        </div>
      </UiSectionCard>
      <UiSectionCard class="block discover-view__hero-side" title="继续播放" description="快速回到最近的听感轨道。">
        <div class="discover-view__hero-actions">
          <UiButton variant="solid" @click="playTrack(featuredItems[0]?.leadTrackId || quickPicks[0]?.track.id || '')">
            立即进入
          </UiButton>
          <p class="discover-view__hero-meta">
            当前聚焦 {{ currentTrackId ? "正在播放中的曲目" : "晨间推荐歌单" }}
          </p>
        </div>
      </UiSectionCard>
    </section>

    <section id="discover-featured-albums">
      <UiSectionCard class="block" title="精选专辑" description="点击卡片即可切换播放上下文，整张专辑加入队列。">
        <SectionHeader title="精选专辑" description="点击卡片即可切换播放上下文，整张专辑加入队列。" />
        <div class="discover-view__album-grid">
          <article
            v-for="item in featuredItems"
            :key="item.album.id"
            class="discover-view__album-entry"
            data-album-card
            :data-active="item.active ? 'true' : 'false'"
            @click="playFeaturedAlbum(item.album.id)"
          >
            <AlbumCard :album="item.album" :active="item.active" />
          </article>
        </div>
      </UiSectionCard>
    </section>

    <section id="discover-quick-picks">
      <UiSectionCard class="block" title="快速入口" description="按场景进入你常用的播放节奏。">
        <div class="discover-view__quick-grid">
          <article v-for="pick in quickPicks" :key="pick.id" class="discover-view__quick-card">
            <UiButton type="button" class="discover-view__quick-main" variant="ghost" block @click="playTrack(pick.track.id)">
              <p class="discover-view__quick-title">
                {{ pick.title }}
              </p>
              <p class="discover-view__quick-subtitle">
                {{ pick.subtitle }}
              </p>
              <p class="discover-view__quick-track">
                {{ pick.track.title }} · {{ pick.track.artist }}
              </p>
            </UiButton>
            <UiIconButton
              class="discover-view__quick-like"
              :icon="likedSet.has(pick.track.id) ? 'solar:heart-bold' : 'solar:heart-outline'"
              :label="likedSet.has(pick.track.id) ? '取消喜欢' : '喜欢'"
              :pressed="likedSet.has(pick.track.id)"
              size="sm"
              variant="ghost"
              :aria-pressed="likedSet.has(pick.track.id) ? 'true' : 'false'"
              @click="toggleLike(pick.track.id)"
            />
          </article>
        </div>
      </UiSectionCard>
    </section>

    <section id="discover-atmosphere">
      <UiSectionCard class="block" title="氛围卡片" description="一键切换到你想要的听感状态。">
        <div class="discover-view__atmosphere-grid">
          <UiButton
            v-for="card in atmosphereCards"
            :key="card.id"
            type="button"
            class="discover-view__atmosphere-card"
            variant="ghost"
            block
            :data-active="card.track.id === currentTrackId ? 'true' : 'false'"
            @click="playTrack(card.track.id)"
          >
            <p class="discover-view__atmosphere-title">
              {{ card.title }}
            </p>
            <p class="discover-view__atmosphere-subtitle">
              {{ card.subtitle }}
            </p>
            <p class="discover-view__atmosphere-track">
              {{ card.track.title }}
            </p>
          </UiButton>
        </div>
      </UiSectionCard>
    </section>

    <section id="discover-recent-plays">
      <UiSectionCard class="block" title="最近播放" description="基于播放器真实 recentPlayIds 自动更新。">
        <RecentPlayList :tracks="recentTracks" :active-track-id="currentTrackId" @play="playTrack" />
      </UiSectionCard>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.discover-view__hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.8fr);
  gap: var(--space-4);
}

h2 {
  margin: 0;
  color: inherit;
  font-size: 30px;
}

p {
  margin: 0;
  color: inherit;
}

.block {
  min-height: 100%;
}

.discover-view__eyebrow {
  margin-bottom: var(--space-2);
  color: var(--color-text-contrast-muted);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.discover-view__hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.discover-view__hero-stats div {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-control-surface);
  border: 1px solid var(--color-control-stroke);
}

.discover-view__hero-stats strong {
  display: block;
  font-size: 26px;
  line-height: 1.1;
}

.discover-view__hero-stats span {
  display: block;
  margin-top: 6px;
  color: var(--color-text-contrast-muted);
  font-size: 12px;
}

.discover-view__hero-side {
  display: flex;
  align-items: stretch;
}

.discover-view__hero-actions {
  display: grid;
  align-content: space-between;
  gap: var(--space-4);
  min-height: 100%;
}

.discover-view__hero-meta {
  margin-top: auto;
  color: var(--color-text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.discover-view__album-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.discover-view__album-entry {
  cursor: pointer;
  transform-origin: center top;
}

.discover-view__album-entry[data-active="true"] {
  border-radius: var(--radius-md);
  outline: 1px solid var(--color-state-border-emphasis);
  outline-offset: 4px;
}

.discover-view__quick-grid,
.discover-view__atmosphere-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
}

.discover-view__quick-card,
.discover-view__atmosphere-card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-state-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-card-surface-soft);
  transform-origin: center center;
  will-change: transform;
}

.discover-view__quick-main {
  width: 100%;
  border-radius: var(--radius-xs);
  padding: var(--space-3);
  text-align: left;
  display: block;
}

.discover-view__quick-like {
  justify-self: flex-start;
}

.discover-view__quick-like[aria-pressed="true"] {
  color: var(--color-accent-pressed);
}

.discover-view__quick-title,
.discover-view__atmosphere-title {
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
}

.discover-view__quick-subtitle,
.discover-view__atmosphere-subtitle {
  margin-top: var(--space-2);
  font-size: 13px;
}

.discover-view__quick-track,
.discover-view__atmosphere-track {
  margin-top: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.discover-view__atmosphere-card {
  text-align: left;
}

.discover-view__atmosphere-card[data-active="true"] {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-state-selected);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--color-accent) 12%, transparent);
}

@media (max-width: 960px) {
  .discover-view__hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
