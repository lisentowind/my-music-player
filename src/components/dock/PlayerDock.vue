<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import { useGsapReveal } from "@/composables/use-gsap";
import { usePlayerStore } from "@/stores/player";

const dockRef = ref<HTMLElement | null>(null);
const coverRef = ref<HTMLElement | null>(null);
const player = usePlayerStore();

const trackTitle = computed(() => player.currentTrack?.title ?? "未开始播放");
const trackArtist = computed(() => {
  const track = player.currentTrack;
  if (!track) {
    return "选择一首歌开始播放";
  }

  return `${track.artist} · ${track.album}`;
});
const playbackStatus = computed(() => player.isPlaying ? "播放中" : "已暂停");
const hasError = computed(() => Boolean(player.errorTrackId && player.errorMessage));
const errorText = computed(() => {
  if (!hasError.value) {
    return "";
  }

  return `播放失败：${player.errorMessage}`;
});

function togglePlay() {
  void player.togglePlay();
}

function playPrevious() {
  void player.playPrevious();
}

function playNext() {
  void player.playNext();
}

function seekTo(time: number) {
  player.seekTo(time);
}

function cycleMode() {
  player.cycleMode();
}

function setVolume(volume: number) {
  player.setVolume(volume);
}

function toggleMute() {
  player.toggleMute();
}

useGsapReveal(dockRef, [".player-dock__meta", ".player-dock__center", ".player-dock__aside"], 0.12);

onMounted(() => {
  if (!dockRef.value) {
    return;
  }

  gsap.fromTo(
    dockRef.value,
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      delay: 0.2,
      ease: "power3.out",
      clearProps: "opacity,visibility,transform",
    },
  );
});

watch(() => player.currentTrack?.id, () => {
  if (!coverRef.value) {
    return;
  }

  gsap.fromTo(
    coverRef.value,
    { scale: 0.92, rotate: -4, autoAlpha: 0.6 },
    {
      scale: 1,
      rotate: 0,
      autoAlpha: 1,
      duration: 0.42,
      ease: "power2.out",
      clearProps: "transform,opacity,visibility",
    },
  );
});
</script>

<template>
  <footer ref="dockRef" class="player-dock" aria-label="全局播放器 Dock">
    <div class="player-dock__ambient" aria-hidden="true" />
    <section class="player-dock__surface glass-surface" data-testid="player-dock-shell">
      <div class="player-dock__meta">
        <div ref="coverRef" class="player-dock__cover" aria-hidden="true">
          <img
            v-if="player.currentTrack"
            class="player-dock__cover-image"
            :src="player.currentTrack.coverSrc"
            :alt="`${player.currentTrack.title} 封面`"
          >
        </div>
        <div class="player-dock__text">
          <p class="player-dock__title" data-testid="player-dock-title">{{ trackTitle }}</p>
          <p class="player-dock__artist" data-testid="player-dock-artist">{{ trackArtist }}</p>
          <p class="player-dock__status">{{ playbackStatus }}</p>
        </div>
      </div>

      <div class="player-dock__center">
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
      </div>

      <div class="player-dock__aside">
        <VolumeControl
          :volume="player.volume"
          :muted="player.muted"
          @set-volume="setVolume"
          @toggle-mute="toggleMute"
        />
        <p class="player-dock__mode">
          Mode · {{ player.activeModeLabel }}
        </p>
      </div>
    </section>
    <p v-if="hasError" class="player-dock__error" role="status">{{ errorText }}</p>
  </footer>
</template>

<style scoped lang="less">
.player-dock {
  position: fixed;
  left: 50%;
  bottom: var(--layout-gap);
  transform: translateX(-50%);
  width: min(1120px, calc(100vw - (var(--layout-gap) * 2)));
  z-index: 30;
  pointer-events: none;
}

.player-dock__ambient {
  position: absolute;
  inset: auto 10% -18px;
  height: 56px;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.66) 0%, rgba(171, 196, 228, 0.2) 40%, transparent 80%);
  filter: blur(18px);
  opacity: 0.72;
  animation: dock-breathing 4.5s ease-in-out infinite;
}

.player-dock__surface {
  position: relative;
  display: grid;
  grid-template-columns: minmax(210px, 260px) minmax(290px, 1fr) minmax(190px, 240px);
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  border-color: var(--color-state-border-emphasis);
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.player-dock__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.player-dock__cover {
  width: 54px;
  height: 54px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-surface-strong);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  position: relative;
}

.player-dock__cover::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
}

.player-dock__cover-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-dock__text {
  min-width: 0;
}

.player-dock__title {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-dock__artist {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-dock__status {
  margin: 6px 0 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.player-dock__center {
  display: grid;
  gap: var(--space-3);
}

.player-dock__aside {
  display: grid;
  gap: var(--space-2);
}

.player-dock__mode {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: right;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.player-dock__error {
  margin: var(--space-2) 0 0;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--color-danger) 38%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-danger) 10%, var(--color-surface-strong));
  color: var(--color-danger);
  font-size: 12px;
  text-align: center;
  pointer-events: auto;
}

@keyframes dock-breathing {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.86;
    transform: scale(1);
  }
}

@media (max-width: 1080px) {
  .player-dock {
    width: calc(100vw - var(--space-6));
  }

  .player-dock__surface {
    grid-template-columns: 1fr;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .player-dock__mode {
    text-align: left;
  }
}

@media (max-width: 720px) {
  .player-dock {
    bottom: var(--space-3);
    width: calc(100vw - var(--space-4));
  }

  .player-dock__ambient {
    inset: auto 4% -14px;
  }
}
</style>
