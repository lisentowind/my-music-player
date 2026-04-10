<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import MediaShelfCard from "@/components/music/MediaShelfCard.vue";
import UiSearchField from "@/components/ui/UiSearchField.vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import { useGsapAmbientFlow, useGsapHoverTargets, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import { storeToRefs } from "pinia";
import {
  auraDefaultPlaylist,
  auraLibraryPlaylists,
  auraRecommendationPlaylists,
  auraTracks,
} from "@/data/aura-content";
import { useExploreStore } from "@/stores/explore";
import { usePlayerStore } from "@/stores/player";
import { EXPLORE_SEARCH_DEBOUNCE_MS } from "@/views/explore.constants";

const exploreRef = ref<HTMLElement | null>(null);
const router = useRouter();
const player = usePlayerStore();
const explore = useExploreStore();
const { searchText } = storeToRefs(explore);
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
const secondaryFeaturedPlaylist = computed(() => auraRecommendationPlaylists[0] ?? auraDefaultPlaylist);
const editorialScenes = computed(() => auraRecommendationPlaylists.map((playlist, index) => ({
  ...playlist,
  badge: index === 0 ? "TRENDING NOW" : index === 1 ? "CURATED MOOD" : "FRESH CUT",
  accent: ["violet", "amber", "mint"][index] ?? "slate",
  leadTrackId: playlist.trackIds[0] ?? auraTracks[0]?.id ?? "",
})));
const extensionShelves = computed(() => [...auraLibraryPlaylists, auraDefaultPlaylist].slice(0, 3));
const quickExploreTracks = computed(() => auraTracks.slice(0, 4));
const browseCategories = computed(() => {
  const seedTags = hotTags.value;
  return [
    {
      id: "category-night",
      title: "深夜脉冲",
      caption: "低频与夜色",
      tag: seedTags[0] ?? "低频",
      icon: "solar:moon-outline" as const,
      accent: "violet",
    },
    {
      id: "category-commute",
      title: "通勤段落",
      caption: "冷调和推进感",
      tag: seedTags[1] ?? "通勤",
      icon: "solar:music-notes-outline" as const,
      accent: "rose",
    },
    {
      id: "category-focus",
      title: "专注工作流",
      caption: "稳定循环",
      tag: seedTags[2] ?? "工作流",
      icon: "solar:monitor-outline" as const,
      accent: "mint",
    },
    {
      id: "category-mood",
      title: "情绪慢放",
      caption: "玻璃质感",
      tag: seedTags[3] ?? "清透",
      icon: "solar:heart-outline" as const,
      accent: "amber",
    },
    {
      id: "category-light",
      title: "晨光氛围",
      caption: "轻一点的电子",
      tag: seedTags[4] ?? "晨光",
      icon: "solar:sun-outline" as const,
      accent: "blue",
    },
    {
      id: "category-library",
      title: "收藏回看",
      caption: "从资料库继续",
      tag: seedTags[5] ?? "精选收藏",
      icon: "solar:user-outline" as const,
      accent: "slate",
    },
  ];
});

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

useGsapReveal(exploreRef, [".explore-view__hero", ".explore-view__featured", ".explore-view__categories", ".explore-view__scenes", ".explore-view__extension", ".explore-view__tags", ".explore-view__playlists", ".explore-view__results"], 0.08);
useGsapScrollReveal(exploreRef, [
  {
    selector: ".explore-view__category-grid > *",
    triggerSelector: ".explore-view__categories",
    y: 22,
    scale: 0.98,
    stagger: 0.04,
  },
  {
    selector: ".explore-view__scene-grid > *",
    triggerSelector: ".explore-view__scenes",
    y: 24,
    scale: 0.98,
    stagger: 0.05,
  },
  {
    selector: ".explore-view__extension-grid > *",
    triggerSelector: ".explore-view__extension",
    y: 24,
    scale: 0.98,
    stagger: 0.05,
  },
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
useGsapHoverTargets(exploreRef, [".explore-view__featured-card", ".explore-view__category-grid > *", ".explore-view__scene-grid > *", ".explore-view__extension-grid > *", ".explore-view__tag-list > *", ".explore-view__playlist-grid > *", ".explore-view__result-grid > *"], {
  hoverY: -3,
  hoverScale: 1.008,
});
useGsapAmbientFlow(exploreRef, [
  {
    selector: ".explore-view__ambient--aurora",
    x: 52,
    y: 38,
    scale: 1.2,
    opacity: 0.24,
    duration: 20,
  },
  {
    selector: ".explore-view__ambient--pulse",
    x: 44,
    y: 32,
    scale: 1.16,
    opacity: 0.2,
    duration: 17,
    delay: 0.7,
  },
  {
    selector: ".explore-view__ambient--mist",
    x: 58,
    y: 36,
    scale: 1.22,
    opacity: 0.16,
    duration: 24,
    delay: 1.1,
  },
]);
</script>

<template>
  <section id="explore-page" ref="exploreRef" class="page explore-view" data-testid="explore-stitch-shell">
    <div class="explore-view__ambient explore-view__ambient--aurora" aria-hidden="true" />
    <div class="explore-view__ambient explore-view__ambient--pulse" aria-hidden="true" />
    <div class="explore-view__ambient explore-view__ambient--mist" aria-hidden="true" />

    <section class="explore-view__hero explore-view__panel" data-testid="explore-stitch-hero" data-explore-layout="editorial-search">
      <p class="explore-view__eyebrow">探索声场</p>
      <h1 class="explore-view__hero-title">探索实验室</h1>
      <p class="explore-view__hero-copy">
        {{ `按曲名、艺人、专辑、歌单和标签检索当前在线模拟曲库，${EXPLORE_SEARCH_DEBOUNCE_MS} 毫秒后给出结果。` }}
      </p>
      <label class="explore-view__search">
        <span class="explore-view__search-label">搜索输入</span>
        <UiSearchField
          v-model="searchText"
          class="explore-view__search-field"
          input-id="explore-search-input"
          data-testid="explore-search-input"
          placeholder="搜索歌曲、歌单、标签或艺人"
          aria-label="探索页搜索输入框"
        />
      </label>
      <div class="explore-view__hero-meta">
        <p>热门标签 {{ hotTags.length }} 个</p>
        <p>检索延迟 {{ EXPLORE_SEARCH_DEBOUNCE_MS }} 毫秒</p>
      </div>
    </section>

    <section
      v-if="!hasQuery"
      class="explore-view__featured"
      data-testid="explore-stitch-featured"
      data-explore-region="hero-featured"
    >
      <button type="button" class="explore-view__featured-card explore-view__featured-card--primary" @click="openPlaylist(auraDefaultPlaylist.id)">
        <img class="explore-view__featured-image" :src="auraDefaultPlaylist.coverSrc" :alt="`${auraDefaultPlaylist.title} 封面`">
        <span class="explore-view__featured-mask" />
        <span class="explore-view__featured-copy">
          <span class="explore-view__featured-badge">趋势主打</span>
          <strong>{{ auraDefaultPlaylist.title }}</strong>
          <small>{{ auraDefaultPlaylist.description }}</small>
        </span>
      </button>
      <button type="button" class="explore-view__featured-card explore-view__featured-card--secondary" @click="openPlaylist(secondaryFeaturedPlaylist.id)">
        <img class="explore-view__featured-image" :src="secondaryFeaturedPlaylist.coverSrc" :alt="`${secondaryFeaturedPlaylist.title} 封面`">
        <span class="explore-view__featured-mask" />
        <span class="explore-view__featured-copy">
          <span class="explore-view__featured-badge explore-view__featured-badge--mint">情绪精选</span>
          <strong>{{ secondaryFeaturedPlaylist.title }}</strong>
          <small>{{ secondaryFeaturedPlaylist.subtitle }}</small>
        </span>
      </button>
    </section>

    <section
      v-if="!hasQuery"
      class="explore-view__categories explore-view__panel"
      data-testid="explore-category-grid"
      data-explore-region="browse-categories"
    >
      <header class="explore-view__panel-head">
        <p class="explore-view__eyebrow">探索分区</p>
        <h2 class="explore-view__section-title">浏览分类</h2>
        <p class="explore-view__section-copy">把探索首页做成更像 Stitch 的彩色磁贴入口，先按氛围切，再进入歌单和结果。</p>
      </header>
      <div class="explore-view__category-grid">
        <button
          v-for="category in browseCategories"
          :key="category.id"
          type="button"
          class="explore-view__category-card"
          :class="`is-${category.accent}`"
          @click="applyTag(category.tag)"
        >
          <span class="explore-view__category-icon" aria-hidden="true">
            <Icon :icon="iconRegistry[category.icon]" />
          </span>
          <span class="explore-view__category-copy">
            <strong>{{ category.title }}</strong>
            <small>{{ category.caption }}</small>
          </span>
          <span class="explore-view__category-tag">{{ category.tag }}</span>
          <span class="explore-view__category-glow" aria-hidden="true" />
        </button>
      </div>
    </section>

    <section
      v-if="!hasQuery"
      class="explore-view__scenes explore-view__panel"
      data-testid="explore-scene-grid"
      data-explore-region="editorial-scenes"
    >
      <header class="explore-view__panel-head">
        <p class="explore-view__eyebrow">编辑专题</p>
        <h2 class="explore-view__section-title">专题场景</h2>
        <p class="explore-view__section-copy">把参考稿里的二级精选区补进来，除了大封面，再提供几张更聚焦的专题入口，帮助你直接进入某种氛围带。</p>
      </header>
      <div class="explore-view__scene-grid">
        <button
          v-for="scene in editorialScenes"
          :key="`scene-${scene.id}`"
          type="button"
          class="explore-view__scene-card"
          :class="`is-${scene.accent}`"
          @click="openPlaylist(scene.id)"
        >
          <img class="explore-view__scene-image" :src="scene.coverSrc" :alt="`${scene.title} 封面`">
          <span class="explore-view__scene-mask" />
          <span class="explore-view__scene-copy">
            <span class="explore-view__scene-badge">{{ scene.badge }}</span>
            <strong>{{ scene.title }}</strong>
            <small>{{ scene.description }}</small>
          </span>
        </button>
      </div>
    </section>

    <section class="explore-view__tags explore-view__panel">
      <header class="explore-view__panel-head">
        <p class="explore-view__eyebrow">快捷入口</p>
        <h2 class="explore-view__section-title">热门标签</h2>
        <p class="explore-view__section-copy">先从常用标签切入，会比盲搜更快找到合适的氛围。</p>
      </header>
      <div class="explore-view__tag-list">
        <button
          v-for="tag in hotTags"
          :key="tag"
          type="button"
          class="explore-view__tag-chip"
          @click="applyTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </section>

    <section
      v-if="!hasQuery"
      class="explore-view__extension explore-view__panel"
      data-testid="explore-browse-grid"
      data-explore-region="browse-extension"
    >
      <header class="explore-view__panel-head">
        <p class="explore-view__eyebrow">继续下潜</p>
        <h2 class="explore-view__section-title">延伸浏览</h2>
        <p class="explore-view__section-copy">参考 Explore 示例页的内容密度，再补一层“快速点播 + 资料库歌单”组合，让无搜索态不只停在分类磁贴。</p>
      </header>
      <div class="explore-view__extension-grid">
        <section class="explore-view__quick-panel">
          <h3 class="explore-view__group-title">快速点播</h3>
          <button
            v-for="(track, index) in quickExploreTracks"
            :key="`quick-${track.id}`"
            type="button"
            class="explore-view__quick-item"
            @click="playTrack(track.id)"
          >
            <span class="explore-view__quick-rank">{{ String(index + 1).padStart(2, "0") }}</span>
            <img class="explore-view__quick-image" :src="track.coverSrc" :alt="`${track.title} 封面`">
            <span class="explore-view__quick-copy">
              <strong>{{ track.title }}</strong>
              <small>{{ track.artist }}</small>
            </span>
            <span class="explore-view__quick-time">{{ track.durationLabel }}</span>
          </button>
        </section>

        <section class="explore-view__shelf-panel">
          <h3 class="explore-view__group-title">资料库与主打歌单</h3>
          <div class="explore-view__shelf-grid">
            <MediaShelfCard
              v-for="playlist in extensionShelves"
              :key="`shelf-${playlist.id}`"
              eyebrow="延伸浏览"
              :title="playlist.title"
              :subtitle="playlist.subtitle"
              :meta="playlist.description"
              :cover-src="playlist.coverSrc"
              @select="openPlaylist(playlist.id)"
            />
          </div>
        </section>
      </div>
    </section>

    <section v-if="!hasQuery" class="explore-view__playlists explore-view__panel">
      <header class="explore-view__panel-head">
        <p class="explore-view__eyebrow">默认探索态</p>
        <h2 class="explore-view__section-title">推荐歌单</h2>
        <p class="explore-view__section-copy">还没输入关键词时，先把主打歌单和推荐区放在这里，帮助你快速进入。</p>
      </header>
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
    </section>

    <section v-else class="explore-view__results explore-view__panel">
      <header class="explore-view__panel-head">
        <p class="explore-view__eyebrow">搜索结果</p>
        <h2 class="explore-view__section-title">结果分组</h2>
        <p class="explore-view__section-copy">{{ `当前关键词：${debouncedSearch}` }}</p>
      </header>

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
            <button
              v-for="tag in matchedTags"
              :key="tag"
              type="button"
              class="explore-view__tag-chip"
              @click="applyTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </section>
      </template>

      <div v-else class="explore-view__empty">
        <p class="explore-view__empty-title">没有找到对应内容</p>
        <p class="explore-view__empty-copy">试试换一个歌手、标签或歌单名称，也可以点上面的热门标签快速切换。</p>
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: 12px;
}

.explore-view {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(10px, 1.35vw, 16px);
  border-radius: 20px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-elevated) 96%, transparent), color-mix(in srgb, var(--color-bg) 98%, transparent));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 78%, transparent);
}

.explore-view__ambient {
  position: absolute;
  z-index: 0;
  border-radius: 999px;
  pointer-events: none;
  mix-blend-mode: screen;
  will-change: transform, opacity, border-radius;
}

.explore-view__ambient--aurora {
  top: -36px;
  right: 10%;
  width: clamp(220px, 28vw, 420px);
  height: 220px;
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-accent) 26%, white 14%), color-mix(in srgb, var(--color-accent) 10%, transparent) 56%, transparent 100%);
  filter: blur(84px);
  opacity: 0.14;
}

.explore-view__ambient--pulse {
  top: 22%;
  left: -2%;
  width: clamp(160px, 18vw, 280px);
  height: clamp(160px, 18vw, 280px);
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, #69f6b8 24%, white 12%), color-mix(in srgb, #69f6b8 8%, transparent) 58%, transparent 100%);
  filter: blur(92px);
  opacity: 0.12;
}

.explore-view__ambient--mist {
  bottom: 6%;
  right: 18%;
  width: clamp(220px, 24vw, 360px);
  height: 200px;
  background: radial-gradient(circle at 48% 52%, color-mix(in srgb, #ff8b9a 18%, white 10%), color-mix(in srgb, #ff8b9a 8%, transparent) 58%, transparent 100%);
  filter: blur(90px);
  opacity: 0.1;
}

.explore-view__panel {
  position: relative;
  z-index: 1;
  border-radius: 18px;
  padding: clamp(14px, 1.5vw, 18px);
  background: var(--color-panel-fill);
  border: 0;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-border) 92%, transparent),
    inset 0 1px 0 var(--color-panel-glow-end),
    var(--shadow-md);
}

.explore-view__panel-head {
  margin-bottom: 12px;
}

.explore-view__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 700;
}

.explore-view__section-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: clamp(20px, 3vw, 26px);
  letter-spacing: -0.02em;
}

.explore-view__section-copy {
  margin: 8px 0 0;
  max-width: 680px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.explore-view__hero {
  position: relative;
  overflow: hidden;
  padding-top: 18px;
  padding-bottom: 18px;
}

.explore-view__hero::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-accent) 54%, transparent), transparent);
}

.explore-view__hero-title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(42px, 5vw, 64px);
  line-height: 0.92;
  letter-spacing: -0.06em;
}

.explore-view__hero-copy {
  margin: 12px 0 0;
  max-width: 700px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.explore-view__search {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.explore-view__search-label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  font-weight: 600;
}

.explore-view__search-field {
  max-width: 720px;
}

.explore-view__hero-meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.explore-view__hero-meta p {
  margin: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--color-control-surface);
  color: var(--color-text-secondary);
  font-size: 11px;
}

.explore-view__featured {
  display: grid;
  gap: 12px;
  grid-template-columns: 1.95fr 0.88fr;
}

.explore-view__featured-card {
  position: relative;
  overflow: hidden;
  min-height: 296px;
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
  border-radius: 22px;
  padding: 0;
  cursor: pointer;
  text-align: left;
  background: color-mix(in srgb, var(--color-surface-contrast) 12%, transparent);
  color: color-mix(in srgb, white 94%, var(--color-accent) 6%);
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.explore-view__featured-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--color-accent) 36%, var(--color-border));
  box-shadow: var(--shadow-lg);
}

.explore-view__featured-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.explore-view__featured-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(8, 8, 8, 0.06), rgba(8, 8, 8, 0.7) 56%, rgba(8, 8, 8, 0.92) 100%);
}

.explore-view__featured-card--secondary .explore-view__featured-mask {
  background: linear-gradient(180deg, rgba(8, 8, 8, 0.18), rgba(8, 8, 8, 0.82) 72%);
}

.explore-view__featured-copy {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 7px;
  padding: clamp(18px, 2vw, 22px);
}

.explore-view__featured-badge {
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 88%, white 12%);
  color: var(--color-on-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.explore-view__featured-badge--mint {
  background: color-mix(in srgb, var(--color-accent) 78%, var(--color-surface-contrast) 22%);
  color: var(--color-on-accent);
}

.explore-view__featured-copy strong {
  font-size: clamp(26px, 3vw, 36px);
  letter-spacing: -0.04em;
}

.explore-view__featured-copy small {
  color: color-mix(in srgb, white 84%, var(--color-accent) 16%);
  font-size: 13px;
  line-height: 1.5;
}

.explore-view__scene-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.explore-view__scene-card {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface-contrast) 16%, transparent);
  color: color-mix(in srgb, white 94%, var(--color-accent) 6%);
  text-align: left;
  cursor: pointer;
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.explore-view__scene-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--color-accent) 38%, var(--color-border));
  box-shadow: var(--shadow-lg);
}

.explore-view__scene-card.is-amber {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #f3c76b 20%, transparent);
}

.explore-view__scene-card.is-mint {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #69f6b8 20%, transparent);
}

.explore-view__scene-image,
.explore-view__scene-mask {
  position: absolute;
  inset: 0;
}

.explore-view__scene-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 520ms ease;
}

.explore-view__scene-card:hover .explore-view__scene-image {
  transform: scale(1.08);
}

.explore-view__scene-mask {
  background: linear-gradient(180deg, rgba(8, 8, 8, 0.14), rgba(8, 8, 8, 0.82) 68%, rgba(8, 8, 8, 0.94) 100%);
}

.explore-view__scene-copy {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 8px;
  padding: 18px;
}

.explore-view__scene-badge {
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, white 18%, transparent);
  color: color-mix(in srgb, white 92%, var(--color-accent) 8%);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.explore-view__scene-copy strong {
  font-size: clamp(20px, 2.4vw, 28px);
  letter-spacing: -0.03em;
}

.explore-view__scene-copy small {
  color: color-mix(in srgb, white 80%, var(--color-accent) 20%);
  font-size: 12px;
  line-height: 1.5;
}

.explore-view__categories {
  position: relative;
  overflow: hidden;
}

.explore-view__category-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.explore-view__category-card {
  position: relative;
  min-height: 176px;
  display: grid;
  align-content: space-between;
  gap: 16px;
  padding: 16px;
  border: none;
  border-radius: 28px;
  color: color-mix(in srgb, white 92%, var(--color-accent) 8%);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease, background-color 180ms ease;
}

.explore-view__category-card.is-violet {
  background: #4f2bb8;
}

.explore-view__category-card.is-rose {
  background: #b3476a;
}

.explore-view__category-card.is-mint {
  background: #15795f;
}

.explore-view__category-card.is-amber {
  background: #956015;
}

.explore-view__category-card.is-blue {
  background: #315cae;
}

.explore-view__category-card.is-slate {
  background: #485066;
}

.explore-view__category-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0) 38%);
  pointer-events: none;
}

.explore-view__category-icon {
  position: relative;
  z-index: 1;
  color: color-mix(in srgb, white 44%, transparent);
}

.explore-view__category-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.explore-view__category-copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
}

.explore-view__category-copy strong {
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 17px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.explore-view__category-copy small {
  color: color-mix(in srgb, white 76%, var(--color-accent) 24%);
  font-size: 11px;
  line-height: 1.45;
}

.explore-view__category-tag {
  position: relative;
  z-index: 1;
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, white 14%, transparent);
  font-size: 10px;
}

.explore-view__category-glow {
  display: none;
}

.explore-view__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.explore-view__tag-chip {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--color-control-surface);
  color: var(--color-text);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.explore-view__tag-chip:hover {
  transform: translateY(-2px);
  border-color: var(--color-state-border-emphasis);
  background: var(--color-state-selected);
}

.explore-view__playlist-grid,
.explore-view__result-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.explore-view__extension-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(280px, 0.86fr) minmax(0, 1.14fr);
}

.explore-view__quick-panel,
.explore-view__shelf-panel {
  border-radius: 18px;
  padding: 14px;
  background: color-mix(in srgb, var(--color-panel-fill) 88%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 88%, transparent);
}

.explore-view__quick-panel {
  display: grid;
  align-content: start;
  gap: 6px;
}

.explore-view__quick-item {
  display: grid;
  grid-template-columns: 24px 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.explore-view__quick-item:hover {
  transform: translateX(2px);
  background: var(--color-control-surface);
}

.explore-view__quick-rank,
.explore-view__quick-time {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.explore-view__quick-image {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  object-fit: cover;
}

.explore-view__quick-copy {
  display: grid;
  min-width: 0;
}

.explore-view__quick-copy strong,
.explore-view__quick-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explore-view__quick-copy strong {
  color: var(--color-text-strong);
  font-size: 14px;
}

.explore-view__quick-copy small {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.explore-view__shelf-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.explore-view__group + .explore-view__group {
  margin-top: 18px;
}

.explore-view__group-title {
  margin: 0 0 10px;
  color: var(--color-text-strong);
  font-size: 16px;
  letter-spacing: -0.01em;
}

.explore-view__empty {
  padding: 22px 0 4px;
  text-align: center;
}

.explore-view__empty-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 18px;
}

.explore-view__empty-copy {
  margin: 8px auto 0;
  max-width: 520px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.explore-view__playlist-grid :deep(.media-shelf-card),
.explore-view__result-grid :deep(.media-shelf-card) {
  background: var(--color-panel-fill);
  border-color: var(--color-border);
}

@media (max-width: 1000px) {
  .explore-view__featured {
    grid-template-columns: 1fr;
  }

  .explore-view__category-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .explore-view__featured-card {
    min-height: 200px;
  }

  .explore-view__scene-card {
    min-height: 200px;
  }

  .explore-view__scene-grid,
  .explore-view__playlist-grid,
  .explore-view__result-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .explore-view__extension-grid {
    grid-template-columns: 1fr;
  }

  .explore-view__shelf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .explore-view {
    border-radius: 20px;
    padding: 16px;
  }

  .explore-view__panel {
    border-radius: 18px;
    padding: 16px;
  }

  .explore-view__scene-grid,
  .explore-view__category-grid,
  .explore-view__shelf-grid,
  .explore-view__playlist-grid,
  .explore-view__result-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
