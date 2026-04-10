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
  if (coverRef.value) {
    const rect = coverRef.value.getBoundingClientRect();
    const payload = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      coverSrc: player.currentTrack?.coverSrc ?? "",
    };
    sessionStorage.setItem("player-fullscreen-origin", JSON.stringify(payload));
  }
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

    <section
      class="player-dock__surface glass-surface"
      data-testid="player-dock-shell"
      data-dock-style="capsule"
      data-dock-glass="heavy"
      data-dock-layout="single-row"
      data-dock-span="viewport"
      data-dock-min-width="880"
      data-dock-min-height="84"
    >
      <div class="player-dock__meta">
        <button
          ref="coverRef"
          type="button"
          class="player-dock__cover"
          data-testid="player-dock-cover-button"
          :aria-label="`进入全屏播放器：${trackTitle}`"
          @click="openPlayerView"
        >
          <img
            v-if="player.currentTrack"
            class="player-dock__cover-image"
            :src="player.currentTrack.coverSrc"
            :alt="`${player.currentTrack.title} 封面`"
          >
        </button>

        <div class="player-dock__text">
          <p class="player-dock__title" data-testid="player-dock-title">{{ trackTitle }}</p>
          <p class="player-dock__artist" data-testid="player-dock-artist">{{ trackArtist }}</p>
        </div>
      </div>

      <div class="player-dock__center">
        <div class="player-dock__center-shell">
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
          </button>
        </div>

        <VolumeControl
          :volume="player.volume"
          :muted="player.muted"
          :show-label="false"
          @set-volume="setVolume"
          @toggle-mute="toggleMute"
        />

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
  left: var(--layout-gap);
  right: var(--layout-gap);
  bottom: var(--layout-gap);
  width: auto;
  z-index: 30;
  pointer-events: none;
}

.player-dock__ambient {
  position: absolute;
  inset: auto 20% -6px;
  height: 52px;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(204, 151, 255, 0.34) 0%, rgba(204, 151, 255, 0.08) 44%, transparent 80%);
  filter: blur(20px);
  opacity: 0.64;
  animation: dock-breathing 4.5s ease-in-out infinite;
}

.player-dock__surface {
  position: relative;
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(340px, 1fr) minmax(180px, 220px);
  align-items: center;
  min-width: 880px;
  min-height: 84px;
  gap: 10px;
  padding: 8px 14px;
  border: 1px solid color-mix(in srgb, var(--color-panel-border) 92%, transparent);
  border-radius: 999px;
  background:
    radial-gradient(circle at 12% 50%, var(--color-panel-glow-start), transparent 24%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 82%, transparent), transparent 46%),
    linear-gradient(180deg, var(--color-popover-glow-start), transparent 38%),
    var(--color-popover-fill);
  box-shadow:
    var(--shadow-md),
    0 22px 44px var(--color-popover-shadow),
    inset 0 1px 0 var(--color-panel-glow-end);
  backdrop-filter: blur(22px) saturate(1.08);
  pointer-events: auto;
}

.player-dock__meta {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.player-dock__cover {
  width: 52px;
  height: 52px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-panel-border) 88%, transparent);
  border-radius: 12px;
  overflow: hidden;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 78%, transparent), transparent 100%),
    var(--color-control-surface-strong);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.player-dock__cover:hover {
  transform: translateY(-1px) scale(1.015);
  box-shadow: var(--shadow-md);
  filter: saturate(1.08);
}

.player-dock__cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-dock__text {
  min-width: 0;
  display: grid;
  gap: 1px;
}

.player-dock__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-dock__artist {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-dock__center {
  display: grid;
  align-items: center;
}

.player-dock__center-shell {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr);
  align-items: center;
  gap: 10px;
  padding: 0;
  border-radius: 999px;
}

.player-dock__aside {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.player-dock__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-dock__action {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 80%, transparent), transparent 100%),
    var(--color-control-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.player-dock__action:hover {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-control-surface-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.player-dock__action :deep(svg) {
  width: 14px;
  height: 14px;
}

.player-dock__aside :deep(.volume-control) {
  grid-template-columns: 32px minmax(72px, 80px);
  gap: 6px;
}

.player-dock__aside :deep(.volume-control__mute) {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-control-surface);
}

.player-dock__center-shell :deep(.playback-controls) {
  grid-template-columns: auto 1fr;
  gap: 8px;
}

.player-dock__center-shell :deep(.playback-controls__mode) {
  min-height: 32px;
  min-width: 32px;
  width: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-control-surface);
}

.player-dock__center-shell :deep(.playback-controls__mode-copy) {
  display: none;
}

.player-dock__center-shell :deep(.playback-controls__mode-icon),
.player-dock__center-shell :deep(.playback-controls__button) {
  width: 32px;
  height: 32px;
  border-radius: 999px;
}

.player-dock__center-shell :deep(.playback-controls__transport) {
  min-height: 40px;
  padding: 0 8px;
  border: none;
  border-radius: 999px;
  background: transparent;
}

.player-dock__center-shell :deep(.playback-controls__button--primary) {
  width: 54px;
  height: 54px;
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-accent) 12%, transparent), var(--shadow-primary-active);
}

.player-dock__center-shell :deep(.playback-progress) {
  grid-template-columns: 32px minmax(180px, 1fr) 32px;
  gap: 4px;
}

.player-dock__center-shell :deep(.playback-progress__time) {
  font-size: 9px;
}

.player-dock__center-shell :deep(.playback-progress__slider) {
  height: 4px;
  border: none;
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
