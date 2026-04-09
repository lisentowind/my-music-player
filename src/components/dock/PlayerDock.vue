<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { gsap } from "gsap";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import QueuePopover from "@/components/music/QueuePopover.vue";
import { animatePopoverEnter, animatePopoverLeave, useGsapHoverTargets, useGsapReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";
import { usePlayerStore } from "@/stores/player";

const router = useRouter();
const dockRef = ref<HTMLElement | null>(null);
const coverRef = ref<HTMLElement | null>(null);
const queueLayerRef = ref<HTMLElement | null>(null);
const queueOpen = ref(false);
const player = usePlayerStore();

const trackTitle = computed(() => player.currentTrack?.title ?? "未开始播放");
const trackArtist = computed(() => {
  const track = player.currentTrack;
  if (!track) {
    return "选择一首歌开始播放";
  }

  return `${track.artist} · ${track.album}`;
});
const playbackStatus = computed(() => player.isPlaying ? "正在播放" : "已暂停");
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

function toggleQueue() {
  queueOpen.value = !queueOpen.value;
}

function closeQueue() {
  queueOpen.value = false;
}

function selectQueueTrack(trackId: string) {
  closeQueue();
  void player.playTrackById(trackId);
}

function openPlayerView() {
  closeQueue();
  void router.push("/player");
}

function handlePointerDown(event: PointerEvent) {
  if (!queueOpen.value) {
    return;
  }

  const target = event.target as Node | null;
  if (target && queueLayerRef.value?.contains(target)) {
    return;
  }

  closeQueue();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeQueue();
  }
}

useGsapReveal(dockRef, [".player-dock__meta", ".player-dock__center", ".player-dock__aside"], 0.12);
useGsapHoverTargets(dockRef, [".player-dock__chip", ".player-dock__action"], {
  hoverY: -2,
  hoverScale: 1.01,
});

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

  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", handlePointerDown);
  window.removeEventListener("keydown", handleKeydown);
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
  <footer ref="dockRef" class="player-dock" aria-label="全局播放器底栏">
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
          <p class="player-dock__eyebrow">当前播放</p>
          <p class="player-dock__title" data-testid="player-dock-title">{{ trackTitle }}</p>
          <p class="player-dock__artist" data-testid="player-dock-artist">{{ trackArtist }}</p>
          <p class="player-dock__status">{{ playbackStatus }}</p>
        </div>

        <span
          class="player-dock__chip player-dock__chip--mode"
          data-testid="player-dock-mode-chip"
          :aria-label="`当前模式 ${player.activeModeLabel}`"
        >
          {{ player.activeModeLabel }}
        </span>
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

      <div ref="queueLayerRef" class="player-dock__aside">
        <div class="player-dock__actions">
          <button
            type="button"
            class="player-dock__action"
            data-testid="player-dock-queue-button"
            aria-label="打开即将播放队列"
            :aria-expanded="queueOpen ? 'true' : 'false'"
            aria-controls="player-dock-queue-popover"
            @click="toggleQueue"
          >
            <Icon :icon="iconRegistry['solar:music-notes-outline']" />
            <span>队列</span>
          </button>

          <button
            type="button"
            class="player-dock__action"
            data-testid="player-dock-open-player"
            aria-label="打开播放器页面"
            @click="openPlayerView"
          >
            <Icon :icon="iconRegistry['solar:monitor-outline']" />
            <span>播放器</span>
          </button>
        </div>

        <VolumeControl
          :volume="player.volume"
          :muted="player.muted"
          @set-volume="setVolume"
          @toggle-mute="toggleMute"
        />

        <p class="player-dock__mode-text">
          总队列 {{ player.queue.length }} 首
        </p>

        <transition :css="false" @enter="animatePopoverEnter" @leave="animatePopoverLeave">
          <QueuePopover
            v-if="queueOpen"
            class="player-dock__popover"
            :current-track="player.currentTrack"
            :upcoming-tracks="player.upcomingTracks"
            :queue-length="player.queue.length"
            @select="selectQueueTrack"
            @close="closeQueue"
          />
        </transition>
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
  width: min(1040px, calc(100vw - (var(--layout-gap) * 2)));
  z-index: 30;
  pointer-events: none;
}

.player-dock__ambient {
  position: absolute;
  inset: auto 12% -18px;
  height: 56px;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(176, 121, 255, 0.32) 0%, rgba(176, 121, 255, 0.08) 40%, transparent 80%);
  filter: blur(20px);
  opacity: 0.72;
  animation: dock-breathing 4.5s ease-in-out infinite;
}

.player-dock__surface {
  position: relative;
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(360px, 1fr) minmax(220px, 260px);
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 34px;
  border-color: color-mix(in srgb, var(--color-accent) 26%, var(--color-state-border-emphasis));
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent),
    rgba(20, 20, 24, 0.88);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.player-dock__meta {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.player-dock__cover {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.player-dock__cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-dock__text {
  min-width: 0;
}

.player-dock__eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.player-dock__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 15px;
  font-weight: 700;
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

.player-dock__chip {
  min-width: 78px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-control-surface) 90%, transparent);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.player-dock__center {
  display: grid;
  gap: 10px;
}

.player-dock__aside {
  position: relative;
  display: grid;
  gap: 10px;
}

.player-dock__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.player-dock__action {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.player-dock__action:hover {
  border-color: var(--color-state-border-emphasis);
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.18);
  transform: translateY(-1px);
}

.player-dock__action :deep(svg) {
  width: 16px;
  height: 16px;
}

.player-dock__mode-text {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: right;
}

.player-dock__popover {
  position: absolute;
  right: 0;
  bottom: calc(100% + 14px);
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
</style>
