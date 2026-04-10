import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const filesToAudit = [
  "src/components/AppShell.vue",
  "src/components/chrome/AppTopbar.vue",
  "src/components/chrome/AppSidebar.vue",
  "src/components/dock/PlayerDock.vue",
  "src/components/dock/PlaybackControls.vue",
  "src/components/dock/VolumeControl.vue",
  "src/components/music/MediaHeroCard.vue",
  "src/components/music/QueuePopover.vue",
  "src/components/music/TrackQueueList.vue",
  "src/views/HomeView.vue",
  "src/views/ExploreView.vue",
  "src/views/PlaylistView.vue",
  "src/views/LibraryView.vue",
  "src/views/PlayerView.vue",
  "src/components/music/MediaShelfCard.vue",
];

const forbiddenSnippets = [
  "color: #fff;",
  "color: #ffffff;",
  "color: rgba(255, 255, 255",
  "border: 1px solid rgba(255, 255, 255",
  "background: rgba(255, 255, 255",
  "background: linear-gradient(135deg, #cc97ff, #9c48ea);",
  "background:\n    linear-gradient(145deg, rgba(255, 255, 255",
  "background:\n    linear-gradient(140deg, rgba(255, 255, 255",
  "background:\n    linear-gradient(155deg, rgba(26, 26, 30, 0.94), rgba(15, 15, 18, 0.93));",
  "box-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);",
  "box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);",
  "box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3);",
  "#69f6b8",
  "#54f1bc",
  "#ff7b97",
  "rgba(173, 129, 255, 0.54)",
  "rgba(255, 120, 146, 0.24)",
  "rgba(173, 129, 255, 0.6)",
  "rgba(93, 238, 188, 0.35)",
  "rgba(204, 151, 255, 0.54)",
  "rgba(173, 129, 255, 0.56)",
  "rgba(105, 246, 184, 0.22)",
  "rgba(204, 151, 255, 0.22)",
  "rgba(255, 139, 154, 0.14)",
  "rgba(105, 246, 184, 0.08)",
  "rgba(105, 246, 184, 0.07)",
  "rgba(204, 151, 255, 0.18)",
];

describe("theme surface audit", () => {
  it("主页面与主卡片组件不再保留会破坏亮暗主题的硬编码前景色和面板色", () => {
    for (const filePath of filesToAudit) {
      const content = readFileSync(filePath, "utf-8");
      for (const snippet of forbiddenSnippets) {
        expect(content.includes(snippet), `${filePath} still contains forbidden theme snippet: ${snippet}`).toBe(false);
      }
    }
  });
});
