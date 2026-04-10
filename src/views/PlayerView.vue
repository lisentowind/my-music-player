<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { gsap } from "gsap";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import LyricsPanel from "@/components/music/LyricsPanel.vue";
import { MOTION_TOKENS, useGsapAmbientFlow, useGsapHoverTargets, useGsapPointerTilt, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";
import { useLyricsStore } from "@/stores/lyrics";
import { usePlayerStore } from "@/stores/player";

const router = useRouter();
const playerRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLElement | null>(null);
const coverRef = ref<HTMLElement | null>(null);
const lyricsStageRef = ref<HTMLElement | null>(null);
const player = usePlayerStore();
const lyrics = useLyricsStore();
const PLAYER_FULLSCREEN_ORIGIN_KEY = "player-fullscreen-origin";
const PLAYER_FULLSCREEN_RETURN_KEY = "player-fullscreen-return";

const currentTrack = computed(() => player.currentTrack);
const playbackHeadline = computed(() => player.isPlaying ? "正在播放" : "沉浸播放器");
const accentTags = computed(() => currentTrack.value?.moods.slice(0, 1) ?? []);

async function animateFromDockCover() {
  await nextTick();
  const coverElement = coverRef.value;
  if (!coverElement) {
    return;
  }

  const raw = sessionStorage.getItem(PLAYER_FULLSCREEN_ORIGIN_KEY);
  if (!raw) {
    return;
  }

  sessionStorage.removeItem(PLAYER_FULLSCREEN_ORIGIN_KEY);

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
    ghost.className = "player-view__cover-ghost";
    ghost.style.position = "fixed";
    ghost.style.left = `${origin.x}px`;
    ghost.style.top = `${origin.y}px`;
    ghost.style.width = `${origin.width}px`;
    ghost.style.height = `${origin.height}px`;
    ghost.style.borderRadius = "14px";
    ghost.style.overflow = "hidden";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "80";
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
    gsap.set(coverElement, { autoAlpha: 0.12, scale: 0.976, filter: "blur(8px)" });
    gsap.fromTo(
      ghost,
      {
        left: origin.x,
        top: origin.y,
        width: origin.width,
        height: origin.height,
        borderRadius: MOTION_TOKENS.coverMorph.startRadius,
      },
      {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height,
        borderRadius: MOTION_TOKENS.coverMorph.endRadius,
        duration: MOTION_TOKENS.coverMorph.duration,
        ease: MOTION_TOKENS.coverMorph.ease,
        onComplete: () => {
          gsap.set(coverElement, { autoAlpha: 1, scale: 1, filter: "blur(0px)" });
          requestAnimationFrame(() => {
            ghost.remove();
            gsap.set(coverElement, { clearProps: "opacity,visibility,transform,filter" });
          });
        },
      },
    );
  } catch {
    sessionStorage.removeItem(PLAYER_FULLSCREEN_ORIGIN_KEY);
  }
}

watch(currentTrack, (track) => {
  if (!track) {
    lyrics.clear();
    return;
  }

  lyrics.loadFromText(track.lyrics, track.id, player.currentTime);
}, {
  immediate: true,
});

watch(() => player.currentTime, (time) => {
  lyrics.updateTime(time);
}, {
  immediate: true,
});

watch(() => currentTrack.value?.id, (nextTrackId, previousTrackId) => {
  if (!nextTrackId || !previousTrackId || nextTrackId === previousTrackId) {
    return;
  }

  const targets = [coverRef.value, backdropRef.value, lyricsStageRef.value].filter(Boolean);
  if (targets.length === 0) {
    return;
  }

  gsap.fromTo(
    targets,
    { autoAlpha: 0.56, y: 14, scale: 0.992, filter: `blur(${MOTION_TOKENS.surfaceSwap.blur}px)` },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: MOTION_TOKENS.surfaceSwap.duration,
      stagger: 0.05,
      ease: MOTION_TOKENS.surfaceSwap.ease,
      clearProps: "opacity,visibility,transform,filter",
    },
  );
});

onMounted(() => {
  void animateFromDockCover();
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

function toggleLikeCurrentTrack() {
  if (!currentTrack.value) {
    return;
  }

  player.toggleLike(currentTrack.value.id);
}

async function exitFullscreenPlayer() {
  if (coverRef.value) {
    const rect = coverRef.value.getBoundingClientRect();
    const payload = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      coverSrc: player.currentTrack?.coverSrc ?? "",
    };
    sessionStorage.setItem(PLAYER_FULLSCREEN_RETURN_KEY, JSON.stringify(payload));
  }

  if (window.history.length > 1) {
    router.back();
    return;
  }

  await router.push("/");
}

useGsapReveal(playerRef, [
  ".player-view__topbar",
  ".player-view__art-stage",
  ".player-view__lyrics-stage",
  ".player-view__progress-stage",
  ".player-view__control-stage",
], 0.08);
useGsapScrollReveal(playerRef, [
  {
    selector: ".player-view__meta > *",
    triggerSelector: ".player-view__art-stage",
    y: 22,
    stagger: 0.05,
    scale: 0.99,
  },
  {
    selector: ".player-view__top-actions > *",
    triggerSelector: ".player-view__topbar",
    y: 16,
    stagger: 0.04,
    scale: 0.99,
  },
]);
useGsapHoverTargets(playerRef, [
  ".player-view__tag",
  ".player-view__like-button",
  ".player-view__top-action",
  ".player-view__back-button",
], {
  hoverY: -2,
  hoverScale: 1.008,
});
useGsapPointerTilt(coverRef, {
  maxRotateX: 5,
  maxRotateY: 6,
  liftY: -4,
  scale: 1.008,
});
useGsapAmbientFlow(playerRef, [
  {
    selector: ".player-view__backdrop-orb--primary",
    x: -32,
    y: -24,
    scale: 1.12,
    opacity: 0.52,
    duration: 18,
  },
  {
    selector: ".player-view__backdrop-orb--secondary",
    x: 38,
    y: -20,
    scale: 1.12,
    opacity: 0.36,
    duration: 24,
    delay: -7,
  },
  {
    selector: ".player-view__backdrop-orb--tertiary",
    x: -24,
    y: 18,
    scale: 1.08,
    opacity: 0.3,
    duration: 21,
    delay: -11,
  },
  {
    selector: ".player-view__art-glow",
    x: 26,
    y: -18,
    scale: 1.08,
    opacity: 0.72,
    duration: 17,
    delay: -3,
  },
]);
</script>

<template>
  <section
    id="player-page"
    ref="playerRef"
    class="page player-view"
    data-player-visual="immersive-stitch"
    data-player-min-width="1220"
    data-player-min-height="760"
  >
    <div ref="backdropRef" class="player-view__backdrop" aria-hidden="true">
      <span class="player-view__backdrop-orb player-view__backdrop-orb--primary" />
      <span class="player-view__backdrop-orb player-view__backdrop-orb--secondary" />
      <span class="player-view__backdrop-orb player-view__backdrop-orb--tertiary" />
    </div>

    <header class="player-view__topbar">
      <div class="player-view__top-left">
        <button
          type="button"
          class="player-view__back-button"
          data-testid="player-fullscreen-back"
          aria-label="退出全屏播放器"
          @click="exitFullscreenPlayer"
        >
          返回
        </button>
        <div class="player-view__now">
          <span class="player-view__now-label">正在播放</span>
          <strong class="player-view__now-title">{{ currentTrack?.album || "沉浸播放器" }}</strong>
        </div>
      </div>

      <div class="player-view__top-actions">
        <button type="button" class="player-view__top-action" aria-label="播放列表信息">
          <Icon :icon="iconRegistry['solar:music-notes-outline']" />
        </button>
        <button type="button" class="player-view__top-action" aria-label="播放器设置">
          <Icon :icon="iconRegistry['solar:settings-minimalistic-outline']" />
        </button>
      </div>
    </header>

    <div class="player-view__canvas" data-testid="player-canvas-layout" data-player-layout="cover-lyrics-split" data-player-balance="art-left-heavy">
      <section class="player-view__art-stage" data-testid="player-cover-stage" data-player-region="art" data-player-art-sizing="responsive-contained">
        <div class="player-view__art-glow" aria-hidden="true" />
        <div ref="coverRef" class="player-view__cover-wrap">
          <img
            v-if="currentTrack"
            data-testid="player-cover-image"
            class="player-view__cover"
            :src="currentTrack.coverSrc"
            :alt="`${currentTrack.title} 封面`"
          >
        </div>

        <div class="player-view__meta">
          <p class="player-view__eyebrow">{{ playbackHeadline }}</p>
          <div class="player-view__title-row">
            <h1 class="player-view__title" data-testid="player-track-title">{{ currentTrack?.title || "挑一首歌，把空间点亮" }}</h1>
            <button
              type="button"
              class="player-view__like-button"
              :aria-pressed="currentTrack && player.likedTrackIdList.includes(currentTrack.id) ? 'true' : 'false'"
              @click="toggleLikeCurrentTrack"
            >
              <Icon :icon="currentTrack && player.likedTrackIdList.includes(currentTrack.id) ? iconRegistry['solar:heart-bold'] : iconRegistry['solar:heart-outline']" />
            </button>
          </div>
          <p class="player-view__artist" data-testid="player-track-artist">
            {{ currentTrack ? currentTrack.artist : "底部播放器栏与这里共用同一套播放器状态。" }}
          </p>

          <div class="player-view__tag-row">
            <span
              v-for="tag in accentTags"
              :key="tag"
              class="player-view__tag"
            >
              {{ tag }}
            </span>
          </div>

        </div>
      </section>

      <section
        ref="lyricsStageRef"
        class="player-view__lyrics-stage"
        data-testid="player-lyrics-stage"
        data-player-region="lyrics"
      >
        <LyricsPanel
          :track-id="lyrics.currentTrackId"
          :lines="lyrics.lines"
          :active-line-index="lyrics.activeLineIndex"
          :status="lyrics.status"
          :error-message="lyrics.errorMessage"
        />
      </section>
    </div>

    <section class="player-view__control-stage">
      <div
        class="player-view__control-shell"
        data-testid="player-immersive-dock"
        data-player-dock-style="immersive-flat-band"
        data-player-dock-fixed="true"
        data-player-dock-integration="flush-surface"
        data-player-dock-min-width="960"
      >
        <section
          class="player-view__progress-stage"
          data-testid="player-progress-stage"
          data-player-region="progress"
        >
          <PlaybackProgress
            :current-time="player.currentTime"
            :duration="player.duration"
            :current-label="player.currentTimeLabel"
            :duration-label="player.durationLabel"
            @seek="seekTo"
          />
        </section>

        <div class="player-view__control-main">
          <div class="player-view__control-track">
            <div class="player-view__control-copy">
              <strong>{{ currentTrack?.title || "未开始播放" }}</strong>
              <small>{{ currentTrack?.artist || "选择一首歌开始播放" }}</small>
            </div>
          </div>

          <PlaybackControls
            :is-playing="player.isPlaying"
            :mode-label="player.activeModeLabel"
            :mode="player.mode"
            @previous="playPrevious"
            @toggle="togglePlay"
            @next="playNext"
            @cycle-mode="cycleMode"
          />

          <div class="player-view__control-side">
            <div class="player-view__side-actions">
              <button type="button" class="player-view__top-action" aria-label="歌词视图">
                <Icon :icon="iconRegistry['solar:music-notes-outline']" />
              </button>
              <button type="button" class="player-view__top-action" aria-label="外接显示器">
                <Icon :icon="iconRegistry['solar:monitor-outline']" />
              </button>
            </div>
            <VolumeControl
              :volume="player.volume"
              :muted="player.muted"
              :show-label="false"
              @set-volume="setVolume"
              @toggle-mute="toggleMute"
            />
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  position: relative;
  min-width: 1220px;
  min-height: 100vh;
  height: 100vh;
  padding: 22px 28px 154px;
  overflow: hidden;
}

.player-view__backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-bg-elevated) 96%, var(--color-accent) 4%), var(--color-bg) 56%, color-mix(in srgb, var(--color-bg) 90%, #06110d 10%) 100%);
  pointer-events: none;
}

.player-view__backdrop-orb {
  position: absolute;
  display: block;
  border-radius: 58% 42% 52% 48% / 44% 56% 46% 54%;
  background: radial-gradient(circle at 35% 35%, color-mix(in srgb, var(--color-accent) 38%, white 6%), color-mix(in srgb, var(--color-accent) 16%, transparent) 58%, transparent 100%);
  filter: blur(62px);
  opacity: 0.34;
  mix-blend-mode: screen;
  will-change: transform, opacity, border-radius;
}

.player-view__backdrop-orb--primary {
  top: 11%;
  left: 26%;
  width: 248px;
  height: 448px;
  opacity: 0.42;
}

.player-view__backdrop-orb--secondary {
  right: 8%;
  bottom: 11%;
  width: 420px;
  height: 248px;
  opacity: 0.28;
}

.player-view__backdrop-orb--tertiary {
  left: 16%;
  bottom: 10%;
  width: 340px;
  height: 148px;
  opacity: 0.24;
}

.player-view__topbar,
.player-view__canvas,
.player-view__control-stage {
  position: relative;
  z-index: 1;
}

.player-view__topbar,
.player-view__top-left,
.player-view__top-actions {
  display: flex;
  align-items: center;
}

.player-view__topbar {
  justify-content: space-between;
  gap: 16px;
  padding: 2px 0;
}

.player-view__top-left {
  gap: 12px;
}

.player-view__back-button,
.player-view__top-action {
  min-width: 38px;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 72%, transparent), transparent 100%),
    var(--color-control-surface);
  color: var(--color-text);
  backdrop-filter: blur(20px);
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.player-view__back-button {
  padding: 0 12px;
  min-width: 50px;
  font-size: 12px;
  font-weight: 700;
}

.player-view__top-action :deep(svg),
.player-view__like-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.player-view__top-actions {
  gap: 8px;
}

.player-view__now {
  display: grid;
  gap: 2px;
}

.player-view__now-label,
.player-view__lyrics-label {
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.player-view__now-title {
  color: var(--color-accent);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 12px;
  letter-spacing: -0.03em;
}

.player-view__canvas {
  display: grid;
  grid-template-columns: minmax(460px, 0.9fr) minmax(420px, 1.08fr);
  gap: clamp(48px, 4.2vw, 88px);
  align-items: center;
  min-height: calc(100vh - 220px);
  padding: 6px 8px 0;
}

.player-view__art-stage {
  position: relative;
  display: grid;
  gap: 18px;
  align-content: center;
  justify-items: start;
}

.player-view__art-glow {
  position: absolute;
  inset: 12% auto auto 8%;
  width: 64%;
  aspect-ratio: 1;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 82%, transparent);
  filter: blur(108px);
  opacity: 0.58;
  pointer-events: none;
  will-change: transform, opacity, border-radius;
}

.player-view__cover-wrap {
  position: relative;
  width: min(100%, 528px, calc(100vh - 350px));
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, var(--color-panel-border) 84%, transparent);
  border-radius: 28px;
  overflow: hidden;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 78%, transparent), transparent 100%),
    var(--color-control-surface);
  box-shadow: var(--shadow-lg);
}

.player-view__cover-wrap::after {
  content: "";
  position: absolute;
  inset: auto 10% -10% 10%;
  height: 24%;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 34%, transparent);
  filter: blur(40px);
  opacity: 0.45;
  pointer-events: none;
}

.player-view__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.03);
}

.player-view__meta {
  position: relative;
  display: grid;
  max-width: 560px;
  gap: 0;
}

.player-view__eyebrow {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.player-view__title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.player-view__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(50px, 4.8vw, 72px);
  line-height: 0.9;
  letter-spacing: -0.06em;
}

.player-view__artist {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 16px;
  font-weight: 500;
}

.player-view__tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.player-view__tag {
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--color-control-surface);
  color: var(--color-text-secondary);
  font-size: 9px;
}

.player-view__like-button {
  width: 38px;
  height: 38px;
  flex: none;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-control-surface);
  color: var(--color-text-strong);
  cursor: pointer;
}

.player-view__lyrics-stage {
  display: grid;
  align-content: center;
  min-height: 580px;
}

.player-view__lyrics-stage :deep(.lyrics-panel) {
  background: transparent;
  min-height: 560px;
  max-width: 720px;
}

.player-view__lyrics-stage :deep(.lyrics-panel__scroll) {
  max-height: 640px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
}

.player-view__lyrics-stage :deep(.lyrics-panel__line) {
  color: color-mix(in srgb, var(--color-text) 20%, transparent);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(32px, 2.85vw, 46px);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: -0.045em;
}

.player-view__lyrics-stage :deep(.lyrics-panel__line[data-active="true"]) {
  color: var(--color-text-strong);
  font-size: clamp(44px, 3.95vw, 58px);
  font-weight: 800;
}

.player-view__progress-stage {
  width: 100%;
  margin: 0;
  padding: 0 4px;
  position: relative;
  z-index: 2;
}

.player-view__progress-stage :deep(.playback-progress) {
  grid-template-columns: 44px minmax(0, 1fr) 44px;
}

.player-view__progress-stage :deep(.playback-progress__time) {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.player-view__progress-stage :deep(.playback-progress__slider) {
  height: 4px;
  border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
  background:
    linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent) var(--playback-progress), color-mix(in srgb, var(--color-text) 14%, transparent) var(--playback-progress), transparent 100%);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-accent) 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-panel-glow-start) 86%, transparent);
}

.player-view__control-stage {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  z-index: 3;
}

.player-view__control-stage::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 154px;
  border-top: 1px solid color-mix(in srgb, var(--color-panel-border) 92%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 12%, transparent), color-mix(in srgb, var(--color-popover-fill) 94%, transparent) 36%, color-mix(in srgb, var(--color-popover-fill) 98%, transparent) 100%);
  backdrop-filter: blur(26px) saturate(1.04);
  pointer-events: none;
}

.player-view__control-shell {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto;
  gap: 12px;
  min-height: 112px;
  width: 100%;
  padding: 14px 34px 18px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.player-view__control-main {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(320px, 1fr) minmax(180px, 0.8fr);
  align-items: center;
  gap: 14px;
}

.player-view__control-track,
.player-view__control-side,
.player-view__side-actions {
  display: flex;
  align-items: center;
}

.player-view__control-track {
  gap: 8px;
  min-width: 0;
}

.player-view__control-copy {
  display: grid;
  min-width: 0;
}

.player-view__control-copy strong,
.player-view__control-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-view__control-copy strong {
  color: var(--color-text-strong);
  font-size: 13px;
}

.player-view__control-copy small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.player-view__control-shell :deep(.playback-controls) {
  grid-template-columns: auto 1fr;
  gap: 8px;
}

.player-view__control-shell :deep(.playback-controls__mode) {
  min-height: 40px;
  min-width: 92px;
  width: auto;
  padding: 0 10px 0 4px;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.player-view__control-shell :deep(.playback-controls__mode-copy) {
  display: grid;
  gap: 2px;
}

.player-view__control-shell :deep(.playback-controls__mode-caption) {
  font-size: 9px;
}

.player-view__control-shell :deep(.playback-controls__mode-label) {
  font-size: 11px;
  font-weight: 700;
}

.player-view__control-shell :deep(.playback-controls__transport) {
  min-height: 46px;
  border-radius: 999px;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  padding: 0;
  gap: 10px;
}

.player-view__control-shell :deep(.playback-controls__button) {
  width: 36px;
  height: 36px;
  border-radius: 999px;
}

.player-view__control-shell :deep(.playback-controls__button--primary) {
  width: 52px;
  height: 52px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 10%, transparent), var(--shadow-primary-hover);
}

.player-view__control-side {
  justify-content: flex-end;
  gap: 14px;
}

.player-view__side-actions {
  gap: 10px;
}

.player-view__control-shell :deep(.volume-control) {
  grid-template-columns: 34px minmax(110px, 1fr);
  gap: 8px;
  width: min(172px, 100%);
}

.player-view__control-shell :deep(.volume-control__mute) {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.player-view__control-shell :deep(.volume-control__slider) {
  height: 4px;
  border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--color-panel-glow-start) 82%, transparent);
}

@media (max-width: 1440px) {
  .player-view__canvas {
    grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1fr);
    gap: 42px;
  }

  .player-view__control-main {
    grid-template-columns: minmax(220px, 0.9fr) minmax(320px, 1fr) minmax(240px, 0.8fr);
  }
}

@media (max-height: 860px) {
  .page {
    padding-top: 18px;
    padding-bottom: 146px;
  }

  .player-view__canvas {
    grid-template-columns: minmax(360px, 0.82fr) minmax(360px, 1fr);
    gap: 34px;
    min-height: calc(100vh - 206px);
  }

  .player-view__cover-wrap {
    width: min(100%, 468px, calc(100vh - 350px));
  }

  .player-view__title {
    font-size: clamp(40px, 4.2vw, 56px);
  }

  .player-view__artist {
    font-size: 14px;
  }

  .player-view__lyrics-stage {
    min-height: 500px;
  }

  .player-view__lyrics-stage :deep(.lyrics-panel) {
    min-height: 500px;
  }

  .player-view__lyrics-stage :deep(.lyrics-panel__scroll) {
    max-height: 520px;
  }

  .player-view__lyrics-stage :deep(.lyrics-panel__line) {
    font-size: clamp(26px, 2.35vw, 36px);
  }

  .player-view__lyrics-stage :deep(.lyrics-panel__line[data-active="true"]) {
    font-size: clamp(34px, 3vw, 46px);
  }

  .player-view__control-shell {
    min-height: 104px;
    padding: 12px 26px 14px;
  }

  .player-view__control-main {
    grid-template-columns: minmax(160px, 0.82fr) minmax(300px, 1fr) minmax(200px, 0.74fr);
  }
}

</style>
