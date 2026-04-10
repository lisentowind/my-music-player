<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { gsap } from "gsap";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import QueuePopover from "@/components/music/QueuePopover.vue";
import { MOTION_TOKENS, animatePopoverEnter, animatePopoverLeave, useGsapHoverTargets, useGsapReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";
import { usePlayerStore } from "@/stores/player";

const router = useRouter();
const dockRef = ref<HTMLElement | null>(null);
const coverRef = ref<HTMLElement | null>(null);
const queueLayerRef = ref<HTMLElement | null>(null);
const queueOpen = ref(false);
const player = usePlayerStore();
const PLAYER_FULLSCREEN_ORIGIN_KEY = "player-fullscreen-origin";
const PLAYER_FULLSCREEN_RETURN_KEY = "player-fullscreen-return";

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
    sessionStorage.setItem(PLAYER_FULLSCREEN_ORIGIN_KEY, JSON.stringify(payload));
  }
  void router.push("/player");
}

async function animateReturnFromPlayer() {
  const surfaceElement = dockRef.value;
  const coverElement = coverRef.value;
  if (!surfaceElement || !coverElement) {
    return false;
  }

  const raw = sessionStorage.getItem(PLAYER_FULLSCREEN_RETURN_KEY);
  if (!raw) {
    return false;
  }

  sessionStorage.removeItem(PLAYER_FULLSCREEN_RETURN_KEY);

  try {
    const rootStyles = getComputedStyle(document.documentElement);
    const origin = JSON.parse(raw) as {
      x: number;
      y: number;
      width: number;
      height: number;
      coverSrc?: string;
    };
    const targetRect = coverElement.getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "player-dock__cover-ghost";
    ghost.style.position = "fixed";
    ghost.style.left = `${origin.x}px`;
    ghost.style.top = `${origin.y}px`;
    ghost.style.width = `${origin.width}px`;
    ghost.style.height = `${origin.height}px`;
    ghost.style.borderRadius = `${MOTION_TOKENS.coverMorph.endRadius}px`;
    ghost.style.overflow = "hidden";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "88";
    ghost.style.boxShadow = rootStyles.getPropertyValue("--shadow-lg").trim() || rootStyles.getPropertyValue("--shadow-md").trim();
    ghost.style.background = rootStyles.getPropertyValue("--color-control-surface-strong").trim() || "rgba(18,18,19,0.92)";
    ghost.style.willChange = "left, top, width, height, border-radius, transform, opacity";

    if (origin.coverSrc) {
      const image = document.createElement("img");
      image.src = origin.coverSrc;
      image.alt = "";
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "cover";
      ghost.appendChild(image);
    }

    document.body.appendChild(ghost);
    gsap.set(surfaceElement, { autoAlpha: 0.72, y: 8, filter: "blur(8px)" });
    gsap.set(coverElement, { autoAlpha: 0.12, scale: 0.972, filter: "blur(8px)" });
    gsap.fromTo(
      ghost,
      {
        left: origin.x,
        top: origin.y,
        width: origin.width,
        height: origin.height,
        borderRadius: MOTION_TOKENS.coverMorph.endRadius,
      },
      {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height,
        borderRadius: MOTION_TOKENS.coverMorph.startRadius,
        duration: MOTION_TOKENS.coverMorph.duration,
        ease: MOTION_TOKENS.coverMorph.ease,
        onComplete: () => {
          ghost.remove();
          gsap.to([surfaceElement, coverElement], {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: MOTION_TOKENS.coverMorph.fadeDuration,
            ease: MOTION_TOKENS.popover.enter.ease,
            stagger: 0.03,
            clearProps: "opacity,visibility,transform,filter",
          });
        },
      },
    );

    return true;
  } catch {
    sessionStorage.removeItem(PLAYER_FULLSCREEN_RETURN_KEY);
    return false;
  }
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
  hoverScale: 1.008,
});

onMounted(() => {
  if (!dockRef.value) {
    return;
  }

  void animateReturnFromPlayer().then((handled) => {
    if (handled || !dockRef.value) {
      return;
    }

    gsap.fromTo(
      dockRef.value,
      { autoAlpha: 0, y: 18, scale: 0.994, filter: "blur(10px)" },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: MOTION_TOKENS.dockEnter.duration,
        delay: 0.18,
        ease: MOTION_TOKENS.dockEnter.ease,
        clearProps: "opacity,visibility,transform,filter",
      },
    );
  });

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
    { scale: 0.94, rotate: -3, autoAlpha: 0.68, filter: `blur(${MOTION_TOKENS.surfaceSwap.blur}px)` },
    {
      scale: 1,
      rotate: 0,
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: MOTION_TOKENS.surfaceSwap.duration,
      ease: MOTION_TOKENS.surfaceSwap.ease,
      clearProps: "transform,opacity,visibility,filter",
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
      data-dock-density="compact"
      data-dock-span="content-pane"
      data-dock-anchor="content-pane"
      data-dock-min-width="880"
      data-dock-min-height="76"
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
            :mode="player.mode"
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
  left: calc(var(--layout-sidebar-width) + (var(--layout-gap) * 2));
  right: 0;
  bottom: var(--layout-gap);
  width: auto;
  z-index: 30;
  pointer-events: none;
}

.player-dock__ambient {
  position: absolute;
  inset: auto 20% -6px;
  height: 42px;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 6%, transparent) 44%, transparent 80%);
  filter: blur(16px);
  opacity: 0.38;
  animation: dock-breathing 4.5s ease-in-out infinite;
}

.player-dock__surface {
  position: relative;
  display: grid;
  grid-template-columns: minmax(158px, 208px) minmax(320px, 1fr) minmax(144px, 186px);
  align-items: center;
  min-width: 880px;
  min-height: 76px;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--color-panel-border) 92%, transparent);
  border-radius: 999px;
  background:
    radial-gradient(circle at 12% 50%, color-mix(in srgb, var(--color-panel-glow-start) 86%, transparent), transparent 22%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 74%, transparent), transparent 40%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-popover-glow-start) 72%, transparent), transparent 34%),
    color-mix(in srgb, var(--color-popover-fill) 95%, transparent);
  box-shadow:
    0 16px 34px var(--color-popover-shadow),
    inset 0 1px 0 var(--color-panel-glow-end);
  backdrop-filter: blur(18px) saturate(1.04);
  pointer-events: auto;
}

.player-dock__meta {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.player-dock__cover {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-panel-border) 88%, transparent);
  border-radius: 10px;
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
  font-size: 12px;
  font-weight: 680;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-dock__artist {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 9px;
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
  grid-template-columns: auto minmax(210px, 1fr);
  align-items: center;
  gap: 6px;
  padding: 0;
  border-radius: 999px;
}

.player-dock__aside {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.player-dock__actions {
  display: flex;
  align-items: center;
  gap: 3px;
}

.player-dock__action {
  width: 28px;
  height: 28px;
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
  width: 12px;
  height: 12px;
}

.player-dock__aside :deep(.volume-control) {
  grid-template-columns: 28px minmax(58px, 66px);
  gap: 4px;
}

.player-dock__aside :deep(.volume-control__mute) {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-control-surface);
}

.player-dock__center-shell :deep(.playback-controls) {
  grid-template-columns: auto 1fr;
  gap: 6px;
}

.player-dock__center-shell :deep(.playback-controls__mode) {
  min-height: 28px;
  min-width: 28px;
  width: 28px;
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
  width: 28px;
  height: 28px;
  border-radius: 999px;
}

.player-dock__center-shell :deep(.playback-controls__transport) {
  min-height: 32px;
  padding: 0 4px;
  border: none;
  border-radius: 999px;
  background: transparent;
}

.player-dock__center-shell :deep(.playback-controls__button--primary) {
  width: 42px;
  height: 42px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 10%, transparent), var(--shadow-primary-active);
}

.player-dock__center-shell :deep(.playback-progress) {
  grid-template-columns: 28px minmax(156px, 1fr) 28px;
  gap: 3px;
}

.player-dock__center-shell :deep(.playback-progress__time) {
  font-size: 8px;
}

.player-dock__center-shell :deep(.playback-progress__slider) {
  height: 2px;
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
