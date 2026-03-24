<script setup lang="ts">
import { computed } from "vue";
import MetricCard from "@/components/music/MetricCard.vue";
import RecentPlayList from "@/components/music/RecentPlayList.vue";
import SectionHeader from "@/components/music/SectionHeader.vue";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import { profileSeed } from "@/data/profile";
import { usePlayerStore } from "@/stores/player";

const player = usePlayerStore();

const currentTrackId = computed(() => player.currentTrack?.id ?? null);
const favoriteMoods = computed(() => (
  player.favoriteMoodTags.length > 0
    ? player.favoriteMoodTags
    : profileSeed.signatureTags
));

const metricCards = computed(() => [
  {
    id: "profile-liked",
    label: "收藏歌曲",
    value: `${player.likedCount} 首`,
    hint: "来自当前会话的喜欢列表",
  },
  {
    id: "profile-recent",
    label: "最近播放歌曲",
    value: `${player.recentTrackCount} 首`,
    hint: "仅记录本次会话播放过的不同歌曲",
  },
  {
    id: "profile-mode",
    label: "活跃模式",
    value: player.activeModeLabel,
    hint: "与底部播放器模式同步",
  },
]);

const recentTracks = computed(() => player.recentPlayTracks);

const recentActivities = computed(() => player.recentPlayTracks.slice(0, 6).map((track, index) => ({
  id: `${track.id}-${index}`,
  title: `${index === 0 ? "刚刚播放" : "最近播放"} · ${track.title}`,
  subtitle: `${track.artist} · ${track.album}`,
})));

function playTrack(trackId: string) {
  void player.playTrackById(trackId);
}
</script>

<template>
  <section id="profile-page" class="page profile-view">
    <section id="profile-overview">
      <GlassPanel class="block">
        <div class="profile-view__hero">
          <img class="profile-view__avatar" :src="profileSeed.avatarSrc" :alt="`${profileSeed.displayName} 头像`">
          <div class="profile-view__hero-meta">
            <p class="profile-view__eyebrow">
              个人中心
            </p>
            <h2>{{ profileSeed.displayName }}</h2>
            <p class="profile-view__headline">
              {{ profileSeed.headline }}
            </p>
            <div class="profile-view__signature-tags">
              <span v-for="tag in profileSeed.signatureTags" :key="tag" class="profile-view__tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </GlassPanel>
    </section>

    <section id="profile-metrics">
      <GlassPanel class="block">
        <SectionHeader title="轻量统计" description="所有数据仅基于当前会话，关闭应用后不会保留。" />
        <div class="profile-view__metric-grid">
          <MetricCard
            v-for="metric in metricCards"
            :key="metric.id"
            :label="metric.label"
            :value="metric.value"
            :hint="metric.hint"
          />
        </div>
      </GlassPanel>
    </section>

    <section id="profile-taste">
      <GlassPanel class="block">
        <SectionHeader title="偏好口味" description="从最近播放与收藏歌曲的 mood tags 做轻量聚合。" />
        <div class="profile-view__taste-tags">
          <span v-for="tag in favoriteMoods" :key="tag" class="profile-view__tag profile-view__tag--taste">
            {{ tag }}
          </span>
        </div>
      </GlassPanel>
    </section>

    <section id="profile-activity">
      <GlassPanel class="block">
        <SectionHeader title="最近播放" description="会话内播放轨迹，点击即可继续播放。" />
        <RecentPlayList :tracks="recentTracks" :active-track-id="currentTrackId" @play="playTrack" />
        <div class="profile-view__activity">
          <h3>最近动态</h3>
          <ul v-if="recentActivities.length > 0" class="profile-view__activity-list">
            <li v-for="item in recentActivities" :key="item.id">
              <p class="profile-view__activity-title">
                {{ item.title }}
              </p>
              <p class="profile-view__activity-subtitle">
                {{ item.subtitle }}
              </p>
            </li>
          </ul>
          <p v-else class="profile-view__activity-empty">
            当前会话还没有播放记录，去发现页点一首歌试试。
          </p>
        </div>
      </GlassPanel>
    </section>
  </section>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.block {
  padding: var(--space-6);
}

h2 {
  margin: 0;
  color: var(--color-text);
}

p {
  margin: 0;
  color: var(--color-text-secondary);
}

.profile-view__hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.profile-view__avatar {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--color-state-border-subtle);
}

.profile-view__hero-meta {
  min-width: 0;
}

.profile-view__eyebrow {
  margin-bottom: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-view__headline {
  margin-top: var(--space-2);
  line-height: 1.5;
}

.profile-view__signature-tags,
.profile-view__taste-tags {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.profile-view__tag {
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-state-surface-muted);
}

.profile-view__tag--taste {
  color: var(--color-text);
}

.profile-view__metric-grid {
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.profile-view__activity {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-state-border-subtle);
}

h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 16px;
}

.profile-view__activity-list {
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-3);
}

.profile-view__activity-title {
  color: var(--color-text);
  font-size: 14px;
}

.profile-view__activity-subtitle {
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.profile-view__activity-empty {
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
