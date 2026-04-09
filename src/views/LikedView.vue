<script setup lang="ts">
import { computed, ref } from "vue";
import MetricCard from "@/components/music/MetricCard.vue";
import SectionHeader from "@/components/music/SectionHeader.vue";
import TrackTable from "@/components/music/TrackTable.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import { tracks } from "@/data/music-library";
import { usePlayerStore } from "@/stores/player";

type SortMode = "recent" | "title" | "artist";

const player = usePlayerStore();
const sortMode = ref<SortMode>("recent");
const likedIdSet = computed(() => new Set(player.likedTrackIdList));
const likedCount = computed(() => player.likedCount);
const likedIdList = computed(() => player.likedTrackIdList);

const likedTracks = computed(() => tracks.filter(track => likedIdSet.value.has(track.id)));

const recentRankMap = computed(() => new Map(
  player.recentPlayIds.map((trackId, index) => [trackId, index] as const),
));

const sortedLikedTracks = computed(() => {
  const nextTracks = [...likedTracks.value];
  if (sortMode.value === "title") {
    return nextTracks.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
  }

  if (sortMode.value === "artist") {
    return nextTracks.sort((a, b) => a.artist.localeCompare(b.artist, "zh-Hans-CN"));
  }

  return nextTracks.sort((a, b) => {
    const aRank = recentRankMap.value.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bRank = recentRankMap.value.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.title.localeCompare(b.title, "zh-Hans-CN");
  });
});

const trackRows = computed(() => sortedLikedTracks.value.map(track => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  album: track.album,
  durationLabel: track.durationLabel,
})));

const activeTrackId = computed(() => player.currentTrack?.id ?? null);

const likedArtistCount = computed(() => new Set(likedTracks.value.map(track => track.artist)).size);

function playTrack(trackId: string) {
  void player.playTrackById(trackId);
}

function toggleLike(trackId: string) {
  player.toggleLike(trackId);
}
</script>

<template>
  <section id="liked-page" class="page liked-view">
    <section id="liked-summary">
      <UiSectionCard class="block" tone="accent">
        <SectionHeader title="我喜欢" description="来自真实播放器状态的喜欢列表与播放联动。" />
        <div class="liked-view__metrics">
          <MetricCard label="喜欢歌曲" :value="`${likedCount} 首`" hint="随时可在任意页面切换喜欢状态" />
          <MetricCard label="活跃歌手" :value="`${likedArtistCount} 位`" hint="根据当前喜欢列表自动聚合" />
        </div>
      </UiSectionCard>
    </section>

    <section id="liked-track-list">
      <UiSectionCard class="block">
        <SectionHeader title="喜欢列表" description="可按最近播放、歌曲名、歌手排序。" />
        <div class="liked-view__sort">
          <UiButton
            type="button"
            class="liked-view__sort-button"
            variant="ghost"
            size="sm"
            :active="sortMode === 'recent'"
            :data-active="sortMode === 'recent' ? 'true' : 'false'"
            @click="sortMode = 'recent'"
          >
            最近播放
          </UiButton>
          <UiButton
            type="button"
            class="liked-view__sort-button"
            variant="ghost"
            size="sm"
            :active="sortMode === 'title'"
            :data-active="sortMode === 'title' ? 'true' : 'false'"
            @click="sortMode = 'title'"
          >
            歌曲名
          </UiButton>
          <UiButton
            type="button"
            class="liked-view__sort-button"
            variant="ghost"
            size="sm"
            :active="sortMode === 'artist'"
            :data-active="sortMode === 'artist' ? 'true' : 'false'"
            @click="sortMode = 'artist'"
          >
            歌手
          </UiButton>
        </div>
        <TrackTable
          v-if="trackRows.length > 0"
          :tracks="trackRows"
          :liked-ids="likedIdList"
          :active-track-id="activeTrackId"
          @play="playTrack"
          @toggle-like="toggleLike"
        />
        <p v-else class="liked-view__empty">
          你还没有喜欢歌曲，去推荐页点一点试试看。
        </p>
      </UiSectionCard>
    </section>

    <section id="liked-insights">
      <UiSectionCard class="block" tone="contrast">
        <SectionHeader title="偏好洞察" description="保持清透、冷感、低干扰，是你当前的听感主线。" />
        <p class="liked-view__insight">
          当前正在播放：{{ player.currentTrack?.title ?? "暂无" }}。在本页点击行内播放与喜欢按钮，会即时同步到底部播放器和推荐页。
        </p>
      </UiSectionCard>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

h2,
h3 {
  margin: 0 0 8px;
  color: var(--color-text);
}

p {
  margin: 0;
  color: var(--color-text-secondary);
}

.liked-view__metrics {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.liked-view__sort {
  margin-bottom: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.liked-view__sort-button {
  font-size: 12px;
}

.liked-view__sort-button[data-active="true"] {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-state-accent-soft);
  color: var(--color-accent-pressed);
}

.liked-view__empty {
  padding: var(--space-4);
}

.liked-view__insight {
  margin-top: var(--space-2);
  line-height: 1.6;
  color: var(--color-text-contrast-muted);
}
</style>
