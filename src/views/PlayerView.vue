<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { gsap } from "gsap";
import PlaybackControls from "@/components/dock/PlaybackControls.vue";
import PlaybackProgress from "@/components/dock/PlaybackProgress.vue";
import VolumeControl from "@/components/dock/VolumeControl.vue";
import LyricsPanel from "@/components/music/LyricsPanel.vue";
import { MOTION_TOKENS, useGsapHoverTargets, useGsapPointerTilt, useGsapReveal, useGsapScrollReveal } from "@/composables/use-gsap";
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

const currentTrack = computed(() => player.currentTrack);
const playbackHeadline = computed(() => player.isPlaying ? "正在播放" : "沉浸播放器");
const accentTags = computed(() => currentTrack.value?.moods.slice(0, 1) ?? []);

async function animateFromDockCover() {
  await nextTick();
  const coverElement = coverRef.value;
  if (!coverElement) {
    return;
  }

  const raw = sessionStorage.getItem("player-fullscreen-origin");
  if (!raw) {
    return;
  }

  sessionStorage.removeItem("player-fullscreen-origin");

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
          ghost.remove();
          gsap.to(coverElement, {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: MOTION_TOKENS.coverMorph.fadeDuration,
            ease: MOTION_TOKENS.popover.enter.ease,
            clearProps: "opacity,visibility,transform,filter",
          });
        },
      },
    );
  } catch {
    sessionStorage.removeItem("player-fullscreen-origin");
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
    <div ref="backdropRef" class="player-view__backdrop" aria-hidden="true" />

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

    <section class="player-view__control-stage">
      <div
        class="player-view__control-shell"
        data-testid="player-immersive-dock"
        data-player-dock-style="immersive-full-width"
        data-player-dock-fixed="true"
        data-player-dock-min-width="960"
      >
        <div class="player-view__control-track">
          <div class="player-view__control-copy">
            <strong>{{ currentTrack?.title || "未开始播放" }}</strong>
            <small>{{ currentTrack?.artist || "选择一首歌开始播放" }}</small>
          </div>
        </div>

        <PlaybackControls
          :is-playing="player.isPlaying"
          :mode-label="player.activeModeLabel"
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
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  position: relative;
  min-width: 1220px;
  min-height: 100vh;
  min-height: max(760px, 100vh);
  padding: 22px 28px 176px;
  overflow: hidden;
}

.player-view__backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 14%, color-mix(in srgb, var(--color-accent) 34%, transparent), transparent 34%),
    radial-gradient(circle at 72% 82%, rgba(105, 246, 184, 0.07), transparent 26%),
    linear-gradient(135deg, color-mix(in srgb, var(--color-bg-elevated) 94%, var(--color-accent) 6%), var(--color-bg) 52%, color-mix(in srgb, var(--color-bg) 88%, #06110d 12%) 100%);
  pointer-events: none;
}

.player-view__topbar,
.player-view__canvas,
.player-view__progress-stage,
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
  min-height: calc(100vh - 250px);
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
  width: 76%;
  aspect-ratio: 1;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 82%, transparent);
  filter: blur(108px);
  opacity: 0.68;
  pointer-events: none;
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
  position: fixed;
  left: 34px;
  right: 34px;
  bottom: 104px;
  width: auto;
  margin: 0;
  padding: 0 8px;
}

.player-view__progress-stage :deep(.playback-progress) {
  grid-template-columns: 42px minmax(0, 1fr) 42px;
}

.player-view__progress-stage :deep(.playback-progress__time) {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.player-view__progress-stage :deep(.playback-progress__slider) {
  height: 3px;
  border: none;
  background:
    linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent) var(--playback-progress), color-mix(in srgb, var(--color-text) 14%, transparent) var(--playback-progress), transparent 100%);
}

.player-view__control-stage {
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 18px;
  padding: 0;
}

.player-view__control-shell {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(320px, 1fr) minmax(180px, 0.8fr);
  align-items: center;
  gap: 14px;
  min-height: 84px;
  width: 100%;
  padding: 10px 18px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 80%, transparent), transparent 46%),
    linear-gradient(180deg, var(--color-popover-glow-start), transparent 42%),
    var(--color-popover-fill);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(32px);
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
  font-size: 12px;
}

.player-view__control-copy small {
  margin-top: 3px;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.player-view__control-shell :deep(.playback-controls) {
  grid-template-columns: auto 1fr;
  gap: 6px;
}

.player-view__control-shell :deep(.playback-controls__mode) {
  min-height: 32px;
  min-width: 32px;
  width: 32px;
  padding: 0;
  border-radius: 999px;
  background: var(--color-control-surface);
  box-shadow: none;
}

.player-view__control-shell :deep(.playback-controls__mode-copy) {
  display: none;
}

.player-view__control-shell :deep(.playback-controls__transport) {
  min-height: 40px;
  border-radius: 999px;
  background: transparent;
  border-color: var(--color-border);
}

.player-view__control-shell :deep(.playback-controls__button) {
  width: 34px;
  height: 34px;
  border-radius: 999px;
}

.player-view__control-shell :deep(.playback-controls__button--primary) {
  width: 50px;
  height: 50px;
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-accent) 12%, transparent), var(--shadow-primary-hover);
}

.player-view__control-side {
  justify-content: flex-end;
  gap: 8px;
}

.player-view__side-actions {
  gap: 6px;
}

.player-view__control-shell :deep(.volume-control) {
  grid-template-columns: 32px minmax(78px, 1fr);
  gap: 5px;
  width: min(138px, 100%);
}

.player-view__control-shell :deep(.volume-control__mute) {
  width: 32px;
  height: 32px;
  border-radius: 999px;
}

.player-view__control-shell :deep(.volume-control__slider) {
  height: 3px;
}

@media (max-width: 1440px) {
  .player-view__canvas {
    grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1fr);
    gap: 42px;
  }

  .player-view__control-shell {
    grid-template-columns: minmax(220px, 0.9fr) minmax(320px, 1fr) minmax(240px, 0.8fr);
  }
}

@media (max-height: 860px) {
  .page {
    padding-top: 18px;
    padding-bottom: 164px;
  }

  .player-view__canvas {
    grid-template-columns: minmax(360px, 0.82fr) minmax(360px, 1fr);
    gap: 34px;
    min-height: calc(100vh - 228px);
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

  .player-view__progress-stage {
    bottom: 96px;
  }

  .player-view__control-shell {
    min-height: 78px;
    padding: 8px 16px;
  }
}
</style>
