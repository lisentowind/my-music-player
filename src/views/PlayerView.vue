<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import LyricsPanel from "@/components/music/LyricsPanel.vue";
import MediaSectionTitle from "@/components/music/MediaSectionTitle.vue";
import TrackQueueList from "@/components/music/TrackQueueList.vue";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import { useGsapHoverTargets, useGsapPointerTilt, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import { useLyricsStore } from "@/stores/lyrics";
import { usePlayerStore } from "@/stores/player";

const playerRef = ref<HTMLElement | null>(null);
const coverRef = ref<HTMLElement | null>(null);
const player = usePlayerStore();
const lyrics = useLyricsStore();

const currentTrack = computed(() => player.currentTrack);
const currentTrackTags = computed(() => currentTrack.value?.moods.slice(0, 3) ?? []);
const playbackHeadline = computed(() => player.isPlaying ? "正在播放" : "沉浸播放器");
const queuePreview = computed(() => player.upcomingTracks.slice(0, 4));

watch(currentTrack, (track) => {
  if (!track) {
    lyrics.clear();
    return;
  }

  lyrics.loadFromText(track.lyrics, track.id);
}, {
  immediate: true,
});

watch(() => player.currentTime, (time) => {
  lyrics.updateTime(time);
}, {
  immediate: true,
});

function togglePlay() {
  void player.togglePlay();
}

function playNext() {
  void player.playNext();
}

function playPrevious() {
  void player.playPrevious();
}

function cycleMode() {
  player.cycleMode();
}

function seekTo(time: number) {
  player.seekTo(time);
}

function setVolume(volume: number) {
  player.setVolume(volume);
}

function toggleMute() {
  player.toggleMute();
}

function playQueueTrack(trackId: string) {
  void player.playTrackById(trackId);
}

function toggleLikeCurrentTrack() {
  if (!currentTrack.value) {
    return;
  }

  player.toggleLike(currentTrack.value.id);
}

useGsapReveal(playerRef, [
  ".player-view__hero",
  ".player-view__control-card",
  ".player-view__lyrics-card",
  ".player-view__queue-card",
], 0.08);
useGsapScrollReveal(playerRef, [
  {
    selector: ".player-view__meta > *",
    triggerSelector: ".player-view__hero",
    y: 24,
    stagger: 0.05,
    scale: 0.99,
  },
  {
    selector: ".player-view__queue-card .track-queue-list__item",
    triggerSelector: ".player-view__queue-card",
    y: 22,
    stagger: 0.05,
    scale: 0.99,
  },
]);
useGsapHoverTargets(playerRef, [".player-view__tag", ".player-view__like-button"], {
  hoverY: -2,
  hoverScale: 1.01,
});
useGsapPointerTilt(coverRef, {
  maxRotateX: 6,
  maxRotateY: 8,
  liftY: -6,
  scale: 1.01,
});
</script>

<template>
  <section id="player-page" ref="playerRef" class="page player-view">
    <div class="player-view__backdrop" aria-hidden="true" />

    <div class="player-view__grid">
      <UiSectionCard class="player-view__hero" tone="contrast">
        <div class="player-view__hero-grid">
          <div class="player-view__meta">
            <p class="player-view__eyebrow">{{ playbackHeadline }}</p>
            <h1 class="player-view__title">{{ currentTrack?.title || "挑一首歌，把空间点亮" }}</h1>
            <p class="player-view__artist">{{ currentTrack ? `${currentTrack.artist} · ${currentTrack.album}` : "底部 Dock 与这里共用同一套播放器状态。" }}</p>
            <p class="player-view__description">
              {{ currentTrack ? "大封面、歌词和控制区保持同一节奏，切歌时会跟着当前会话同步。" : "还没开始播放时，先去首页或探索页挑一首歌。" }}
            </p>

            <div class="player-view__tag-row">
              <span
                v-for="tag in currentTrackTags"
                :key="tag"
                class="player-view__tag"
              >
                {{ tag }}
              </span>
            </div>

            <button
              type="button"
              class="player-view__like-button"
              :aria-pressed="currentTrack && player.likedTrackIdList.includes(currentTrack.id) ? 'true' : 'false'"
              @click="toggleLikeCurrentTrack"
            >
              {{ currentTrack && player.likedTrackIdList.includes(currentTrack.id) ? "已加入喜欢" : "加入喜欢" }}
            </button>
          </div>

          <div ref="coverRef" class="player-view__cover-wrap">
            <img
              v-if="currentTrack"
              data-testid="player-cover-image"
              class="player-view__cover"
              :src="currentTrack.coverSrc"
              :alt="`${currentTrack.title} 封面`"
            >
          </div>
        </div>
      </UiSectionCard>

      <UiSectionCard class="player-view__control-card">
        <MediaSectionTitle
          eyebrow="当前控制"
          title="播放控制"
          description="这里的控制与底部 Dock 完全共用同一状态源。"
        />

        <div class="player-view__control-stack" data-testid="player-view-controls">
          <PlaybackControls
            :is-playing="player.isPlaying"
            :mode-label="player.activeModeLabel"
            @previous="playPrevious"
            @toggle="togglePlay"
            @next="playNext"
            @cycle-mode="cycleMode"
          />
          <PlaybackProgress
            :current-time="player.currentTime"
            :duration="player.duration"
            :current-label="player.currentTimeLabel"
            :duration-label="player.durationLabel"
            @seek="seekTo"
          />
          <VolumeControl
            :volume="player.volume"
            :muted="player.muted"
            @set-volume="setVolume"
            @toggle-mute="toggleMute"
          />
        </div>
      </UiSectionCard>

      <UiSectionCard class="player-view__lyrics-card">
        <MediaSectionTitle
          eyebrow="同步歌词"
          title="逐行歌词"
          description="歌词高亮会跟着当前进度移动，没有歌词时则显示中文空状态。"
        />
        <LyricsPanel
          :lines="lyrics.lines"
          :active-line-index="lyrics.activeLineIndex"
          :status="lyrics.status"
          :error-message="lyrics.errorMessage"
        />
      </UiSectionCard>

      <UiSectionCard class="player-view__queue-card">
        <MediaSectionTitle
          eyebrow="即将播放"
          title="队列预览"
          description="保留和底部 Dock 相同的上下文，只是这里提供更大的沉浸视角。"
        />
        <TrackQueueList :tracks="queuePreview" @select="playQueueTrack" />
      </UiSectionCard>
    </div>
  </section>
</template>

<style scoped lang="less">
.page {
  position: relative;
  min-height: calc(100vh - var(--layout-dock-space) - (var(--layout-gap) * 2));
}

.player-view__backdrop {
  position: absolute;
  inset: 0;
  border-radius: 36px;
  background:
    radial-gradient(circle at 12% 18%, rgba(113, 166, 225, 0.18), transparent 28%),
    radial-gradient(circle at 85% 12%, rgba(52, 218, 173, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 42%);
  pointer-events: none;
}

.player-view__grid {
  position: relative;
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.82fr);
}

.player-view__hero,
.player-view__control-card,
.player-view__lyrics-card,
.player-view__queue-card {
  min-width: 0;
}

.player-view__hero {
  grid-column: 1 / -1;
}

.player-view__hero-grid {
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: center;
}

.player-view__meta {
  display: grid;
  gap: 0;
}

.player-view__eyebrow {
  margin: 0 0 10px;
  color: var(--color-text-contrast-muted);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.player-view__title {
  margin: 0;
  color: var(--color-text-contrast);
  font-size: 64px;
  line-height: 0.92;
  letter-spacing: -0.05em;
}

.player-view__artist {
  margin: 18px 0 0;
  color: var(--color-text-contrast);
  font-size: 18px;
  font-weight: 600;
}

.player-view__description {
  max-width: 620px;
  margin: 16px 0 0;
  color: var(--color-text-contrast-muted);
  font-size: 15px;
  line-height: 1.7;
}

.player-view__tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.player-view__tag {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  color: var(--color-text-contrast);
  font-size: 12px;
  background: rgba(255, 255, 255, 0.06);
}

.player-view__like-button {
  width: fit-content;
  margin-top: 22px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-contrast);
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease;
}

.player-view__like-button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.12);
}

.player-view__cover-wrap {
  position: relative;
  aspect-ratio: 1;
  border-radius: 34px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 38%),
    rgba(255, 255, 255, 0.04);
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.player-view__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.06) contrast(1.05);
}

.player-view__control-stack {
  display: grid;
  gap: 16px;
}

.player-view__queue-card :deep(.track-queue-list__head) {
  display: none;
}
</style>
