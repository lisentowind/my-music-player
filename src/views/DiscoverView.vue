<script setup lang="ts">
import { computed } from "vue";
import { getActivePinia } from "pinia";
import AlbumCard from "@/components/music/AlbumCard.vue";
import RecentPlayList from "@/components/music/RecentPlayList.vue";
import SectionHeader from "@/components/music/SectionHeader.vue";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import {
  discoverAtmospheres,
  featuredAlbums,
  getTracksByIds,
  likedTrackIds,
  tracks,
} from "@/data/music-library";
import { profileSeed } from "@/data/profile";
import { usePlayerStore } from "@/stores/player";

const activePinia = getActivePinia();
const player = activePinia ? usePlayerStore(activePinia) : null;

const currentTrackId = computed(() => player?.currentTrack?.id ?? null);
const likedSet = computed(() => new Set(player?.likedTrackIdList ?? []));
const queueCount = computed(() => player?.queue.length ?? tracks.length);
const likedCount = computed(() => player?.likedCount ?? likedTrackIds.length);

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

const recentTracks = computed(() => getTracksByIds(player?.recentPlayIds ?? []));

function playFeaturedAlbum(albumId: string) {
  if (!player) {
    return;
  }

  const target = featuredItems.value.find(item => item.album.id === albumId);
  if (!target || !target.leadTrackId) {
    return;
  }

  void player.playContext(target.albumTracks, target.leadTrackId);
}

function playTrack(trackId: string) {
  if (!player) {
    return;
  }

  void player.playTrackById(trackId);
}

function toggleLike(trackId: string) {
  if (!player) {
    return;
  }

  player.toggleLike(trackId);
}
</script>

<template>
  <section id="discover-page" class="page discover-view">
    <section id="discover-hero">
      <GlassPanel class="block">
        <p class="discover-view__eyebrow">
          今日推荐
        </p>
        <h2>欢迎回来，林雾</h2>
        <p>继续沉浸在你偏好的清透声场里，从精选专辑、情境入口到最近播放一键接续。</p>
        <p class="discover-view__hero-meta">
          当前曲库 {{ queueCount }} 首 · 已喜欢 {{ likedCount }} 首
        </p>
      </GlassPanel>
    </section>

    <section id="discover-featured-albums">
      <GlassPanel class="block">
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
      </GlassPanel>
    </section>

    <section id="discover-quick-picks">
      <GlassPanel class="block">
        <SectionHeader title="快速入口" description="按场景进入你常用的播放节奏。" />
        <div class="discover-view__quick-grid">
          <article v-for="pick in quickPicks" :key="pick.id" class="discover-view__quick-card glass-surface">
            <button type="button" class="discover-view__quick-main" @click="playTrack(pick.track.id)">
              <p class="discover-view__quick-title">
                {{ pick.title }}
              </p>
              <p class="discover-view__quick-subtitle">
                {{ pick.subtitle }}
              </p>
              <p class="discover-view__quick-track">
                {{ pick.track.title }} · {{ pick.track.artist }}
              </p>
            </button>
            <button
              type="button"
              class="discover-view__quick-like"
              :aria-pressed="likedSet.has(pick.track.id) ? 'true' : 'false'"
              @click="toggleLike(pick.track.id)"
            >
              {{ likedSet.has(pick.track.id) ? "已喜欢" : "喜欢" }}
            </button>
          </article>
        </div>
      </GlassPanel>
    </section>

    <section id="discover-atmosphere">
      <GlassPanel class="block">
        <SectionHeader title="氛围卡片" description="一键切换到你想要的听感状态。" />
        <div class="discover-view__atmosphere-grid">
          <button
            v-for="card in atmosphereCards"
            :key="card.id"
            type="button"
            class="discover-view__atmosphere-card glass-surface"
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
          </button>
        </div>
      </GlassPanel>
    </section>

    <section id="discover-recent-plays">
      <GlassPanel class="block">
        <SectionHeader title="最近播放" description="基于播放器真实 recentPlayIds 自动更新。" />
        <RecentPlayList :tracks="recentTracks" :active-track-id="currentTrackId" @play="playTrack" />
      </GlassPanel>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.block {
  padding: var(--space-6);
}

h2 {
  margin: 0;
  color: var(--color-text);
}

p {
  margin: 0;
  color: var(--color-text-secondary);
}

.discover-view__eyebrow {
  margin-bottom: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.discover-view__hero-meta {
  margin-top: var(--space-4);
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.discover-view__album-grid {
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.discover-view__album-entry {
  cursor: pointer;
}

.discover-view__album-entry[data-active="true"] {
  border-radius: var(--radius-md);
  outline: 1px solid var(--color-state-border-emphasis);
  outline-offset: 4px;
}

.discover-view__quick-grid,
.discover-view__atmosphere-grid {
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
}

.discover-view__quick-card,
.discover-view__atmosphere-card {
  padding: var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
}

.discover-view__quick-main {
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.discover-view__quick-like {
  margin-top: var(--space-3);
  border: 1px solid var(--color-state-border-subtle);
  border-radius: var(--radius-xs);
  background: transparent;
  padding: 8px 10px;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.discover-view__quick-like[aria-pressed="true"] {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-state-accent-soft);
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
  cursor: pointer;
}

.discover-view__atmosphere-card[data-active="true"] {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-state-selected);
}
</style>
