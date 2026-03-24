<script setup lang="ts">
import { computed } from "vue";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import { usePlayerStore } from "@/stores/player";

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
const volumeStatus = computed(() => player.muted ? "静音中" : `音量 ${Math.round(player.volume * 100)}%`);
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
</script>

<template>
  <footer class="player-dock" aria-label="全局播放器 Dock">
    <div class="player-dock__ambient" aria-hidden="true" />
    <section class="player-dock__surface glass-surface">
      <div class="player-dock__meta">
        <div class="player-dock__cover" aria-hidden="true">
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
          class="player-dock__volume"
          :volume="player.volume"
          :muted="player.muted"
          @set-volume="setVolume"
          @toggle-mute="toggleMute"
        />
        <p class="player-dock__mode" data-testid="player-dock-volume-status">
          {{ volumeStatus }} · {{ player.activeModeLabel }}
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
  bottom: var(--space-4);
  transform: translateX(-50%);
  width: min(1080px, calc(100vw - var(--space-8)));
  z-index: 30;
  pointer-events: none;
}

.player-dock__ambient {
  position: absolute;
  inset: auto 10% -18px;
  height: 64px;
  border-radius: 999px;
  background:
    radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--color-accent) 22%, white) 0%,
      color-mix(in srgb, var(--color-accent) 14%, transparent) 40%,
      transparent 82%
    );
  filter: blur(20px);
  opacity: 0.84;
  animation: dock-breathing 4.5s ease-in-out infinite;
}

.player-dock__surface {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(320px, 1fr) minmax(190px, 240px);
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: 24px;
  border: 1px solid var(--color-border-strong);
  background:
    radial-gradient(circle at 14% 10%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 34%),
    linear-gradient(145deg, var(--color-glass-highlight-start), var(--color-glass-highlight-end)),
    var(--color-surface);
  box-shadow:
    var(--shadow-lg),
    inset 0 1px 0 color-mix(in srgb, white 34%, transparent);
  pointer-events: auto;
  overflow: hidden;
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(145deg, var(--color-glass-highlight-start), var(--color-glass-highlight-end)),
    var(--color-surface-strong);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
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
  color: var(--color-accent);
  font-size: 11px;
}

.player-dock__center {
  display: grid;
  gap: 10px;
}

.player-dock__aside {
  display: grid;
  gap: var(--space-2);
  justify-items: end;
}

.player-dock__volume {
  width: min(100%, 240px);
}

.player-dock__mode {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: right;
}

.player-dock__error {
  margin: var(--space-2) 0 0;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, #d87575 34%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, #f3b4b4 12%, var(--color-surface-strong));
  color: color-mix(in srgb, #cf6666 74%, var(--color-text));
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

  .player-dock__aside {
    justify-items: stretch;
  }

  .player-dock__volume,
  .player-dock__mode {
    width: 100%;
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
