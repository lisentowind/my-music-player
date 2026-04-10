<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import MediaSectionTitle from "@/components/music/MediaSectionTitle.vue";
import MediaShelfCard from "@/components/music/MediaShelfCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import { useGsapHoverTargets, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import {
  auraDefaultPlaylist,
  auraLibraryPlaylists,
  auraRecommendationPlaylists,
  auraTracks,
} from "@/data/aura-content";
import { usePlayerStore } from "@/stores/player";
import { EXPLORE_SEARCH_DEBOUNCE_MS } from "@/views/explore.constants";

const exploreRef = ref<HTMLElement | null>(null);
const router = useRouter();
const player = usePlayerStore();
const searchText = ref("");
const debouncedSearch = ref("");
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const playlistPool = computed(() => [
  auraDefaultPlaylist,
  ...auraRecommendationPlaylists,
  ...auraLibraryPlaylists,
]);

const allTags = computed(() => Array.from(new Set([
  ...auraTracks.flatMap(track => [...track.tags, ...track.moods]),
  ...playlistPool.value.flatMap(playlist => playlist.tags),
])));

const hotTags = computed(() => allTags.value.slice(0, 8));

const normalizedQuery = computed(() => debouncedSearch.value.trim().toLowerCase());
const hasQuery = computed(() => normalizedQuery.value.length > 0);

const matchedTracks = computed(() => {
  if (!hasQuery.value) {
    return [];
  }

  return auraTracks.filter(track => {
    const fields = [track.title, track.artist, track.album, ...track.tags, ...track.moods];
    return fields.some(field => field.toLowerCase().includes(normalizedQuery.value));
  });
});

const matchedPlaylists = computed(() => {
  if (!hasQuery.value) {
    return [];
  }

  return playlistPool.value.filter(playlist => {
    const fields = [playlist.title, playlist.subtitle, playlist.description, playlist.zone, ...playlist.tags];
    return fields.some(field => field.toLowerCase().includes(normalizedQuery.value));
  });
});

const matchedTags = computed(() => {
  if (!hasQuery.value) {
    return [];
  }

  return allTags.value.filter(tag => tag.toLowerCase().includes(normalizedQuery.value));
});

const hasResults = computed(() => matchedTracks.value.length > 0 || matchedPlaylists.value.length > 0 || matchedTags.value.length > 0);

watch(searchText, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    debouncedSearch.value = value;
  }, EXPLORE_SEARCH_DEBOUNCE_MS);
});

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
});

function playTrack(trackId: string) {
  void player.playTrackById(trackId);
}

function openPlaylist(playlistId: string) {
  void router.push({
    name: "playlist-detail",
    params: { playlistId },
  });
}

function applyTag(tag: string) {
  searchText.value = tag;
}

useGsapReveal(exploreRef, [".explore-view__hero", ".explore-view__tags", ".explore-view__playlists", ".explore-view__results"], 0.08);
useGsapScrollReveal(exploreRef, [
  {
    selector: ".explore-view__tag-list > *",
    triggerSelector: ".explore-view__tags",
    y: 22,
    scale: 0.98,
    stagger: 0.04,
  },
  {
    selector: ".explore-view__playlist-grid > *",
    triggerSelector: ".explore-view__playlists",
    y: 26,
    scale: 0.98,
    stagger: 0.06,
  },
  {
    selector: ".explore-view__result-grid > *",
    triggerSelector: ".explore-view__results",
    y: 26,
    scale: 0.98,
    stagger: 0.05,
  },
]);
useGsapHoverTargets(exploreRef, [".explore-view__tag-list > *", ".explore-view__playlist-grid > *", ".explore-view__result-grid > *"], {
  hoverY: -3,
  hoverScale: 1.01,
});
</script>

<template>
  <section id="explore-page" ref="exploreRef" class="page explore-view">
    <UiSectionCard class="explore-view__hero" tone="contrast">
      <MediaSectionTitle
        eyebrow="探索声场"
        title="探索声场"
        :description="`按曲名、艺人、专辑、歌单和标签检索当前在线模拟曲库，${EXPLORE_SEARCH_DEBOUNCE_MS} 毫秒后给出结果。`"
      />

      <label class="explore-view__search">
        <span class="explore-view__search-label">搜索输入</span>
        <input
          v-model="searchText"
          data-testid="explore-search-input"
          class="explore-view__search-input"
          type="search"
          autocomplete="off"
          placeholder="搜索歌曲、歌单、标签或艺人"
        >
      </label>
    </UiSectionCard>

    <UiSectionCard class="explore-view__tags">
      <MediaSectionTitle
        eyebrow="快捷入口"
        title="热门标签"
        description="先从常用标签切入，会比盲搜更快找到合适的氛围。"
      />
      <div class="explore-view__tag-list">
        <UiButton
          v-for="tag in hotTags"
          :key="tag"
          type="button"
          variant="ghost"
          size="sm"
          @click="applyTag(tag)"
        >
          {{ tag }}
        </UiButton>
      </div>
    </UiSectionCard>

    <UiSectionCard v-if="!hasQuery" class="explore-view__playlists">
      <MediaSectionTitle
        eyebrow="默认探索态"
        title="推荐歌单"
        description="还没输入关键词时，先把主打歌单和推荐区放在这里，帮助你快速进入。"
      />
      <div class="explore-view__playlist-grid">
        <MediaShelfCard
          :data-testid="`explore-playlist-open-${auraDefaultPlaylist.id}`"
          eyebrow="默认歌单"
          :title="auraDefaultPlaylist.title"
          :subtitle="auraDefaultPlaylist.subtitle"
          :meta="`${auraDefaultPlaylist.statusLabel} · ${auraDefaultPlaylist.trackIds.length} 首曲目`"
          :cover-src="auraDefaultPlaylist.coverSrc"
          @select="openPlaylist(auraDefaultPlaylist.id)"
        />
        <MediaShelfCard
          v-for="playlist in auraRecommendationPlaylists"
          :key="playlist.id"
          :data-testid="`explore-playlist-open-${playlist.id}`"
          eyebrow="推荐歌单"
          :title="playlist.title"
          :subtitle="playlist.subtitle"
          :meta="`${playlist.statusLabel} · ${playlist.trackIds.length} 首曲目`"
          :cover-src="playlist.coverSrc"
          @select="openPlaylist(playlist.id)"
        />
      </div>
    </UiSectionCard>

    <UiSectionCard v-else class="explore-view__results">
      <MediaSectionTitle
        eyebrow="搜索结果"
        title="结果分组"
        :description="`当前关键词：${debouncedSearch}`"
      />

      <template v-if="hasResults">
        <section v-if="matchedTracks.length > 0" class="explore-view__group">
          <h3 class="explore-view__group-title">匹配歌曲</h3>
          <div class="explore-view__result-grid">
            <MediaShelfCard
              v-for="track in matchedTracks"
              :key="track.id"
              compact
              eyebrow="歌曲匹配"
              :title="track.title"
              :subtitle="track.artist"
              :meta="`${track.album} · ${track.durationLabel}`"
              :cover-src="track.coverSrc"
              @select="playTrack(track.id)"
            />
          </div>
        </section>

        <section v-if="matchedPlaylists.length > 0" class="explore-view__group">
          <h3 class="explore-view__group-title">匹配歌单</h3>
          <div class="explore-view__result-grid">
            <MediaShelfCard
              v-for="playlist in matchedPlaylists"
              :key="playlist.id"
              :data-testid="`explore-playlist-open-${playlist.id}`"
              eyebrow="歌单匹配"
              :title="playlist.title"
              :subtitle="playlist.subtitle"
              :meta="playlist.zone"
              :cover-src="playlist.coverSrc"
              @select="openPlaylist(playlist.id)"
            />
          </div>
        </section>

        <section v-if="matchedTags.length > 0" class="explore-view__group">
          <h3 class="explore-view__group-title">标签匹配</h3>
          <div class="explore-view__tag-list">
            <UiButton
              v-for="tag in matchedTags"
              :key="tag"
              type="button"
              variant="ghost"
              size="sm"
              @click="applyTag(tag)"
            >
              {{ tag }}
            </UiButton>
          </div>
        </section>
      </template>

      <div v-else class="explore-view__empty">
        <p class="explore-view__empty-title">没有找到对应内容</p>
        <p class="explore-view__empty-copy">试试换一个歌手、标签或歌单名称，也可以点上面的热门标签快速切换。</p>
      </div>
    </UiSectionCard>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.explore-view__search {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.explore-view__search-label {
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.explore-view__search-input {
  min-height: 62px;
  padding: 0 20px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: var(--color-text);
  font-size: 15px;
}

.explore-view__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.explore-view__playlist-grid,
.explore-view__result-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.explore-view__group + .explore-view__group {
  margin-top: 24px;
}

.explore-view__group-title {
  margin: 0 0 14px;
  color: var(--color-text);
  font-size: 18px;
}

.explore-view__empty {
  padding: 28px 0 8px;
  text-align: center;
}

.explore-view__empty-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 22px;
}

.explore-view__empty-copy {
  margin: 10px auto 0;
  max-width: 520px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}
</style>
