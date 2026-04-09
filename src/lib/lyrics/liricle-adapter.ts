import Liricle from "liricle";

export interface LyricLine {
  index: number;
  time: number;
  text: string;
}

function normalizeLines(data: { lines?: Array<{ time: number; text: string }> } | null) {
  const lines = data?.lines ?? [];
  return lines.map((line, index) => ({
    index,
    time: Number.isFinite(line.time) ? line.time : 0,
    text: line.text,
  }));
}

function parseLrcText(text: string) {
  const lines = text
    .split(/\r?\n/u)
    .map(rawLine => rawLine.trim())
    .filter(Boolean)
    .flatMap((rawLine) => {
      const matches = [...rawLine.matchAll(/\[(\d{2}):(\d{2})\.(\d{2})\]/gu)];
      if (matches.length === 0) {
        return [];
      }

      const content = rawLine.replace(/\[(\d{2}):(\d{2})\.(\d{2})\]/gu, "").trim();
      return matches.map((match, index) => ({
        index,
        time: Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 100,
        text: content,
      }));
    });

  return lines
    .sort((left, right) => left.time - right.time)
    .map((line, index) => ({ ...line, index }));
}

function findActiveLineIndex(lines: readonly LyricLine[], time: number) {
  if (lines.length === 0) {
    return -1;
  }

  const safeTime = Number.isFinite(time) ? time : 0;
  let activeIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (safeTime >= lines[index]!.time) {
      activeIndex = index;
    } else {
      break;
    }
  }

  return activeIndex;
}

export function createLiricleAdapter() {
  const liricle = new Liricle();
  let lines: LyricLine[] = [];

  liricle.on("load", data => {
    lines = normalizeLines(data);
  });

  return {
    loadFromText(text: string) {
      lines = [];
      liricle.load({ text });
      lines = normalizeLines(liricle.data);
      if (lines.length === 0) {
        lines = parseLrcText(text);
      }
      return lines;
    },
    setOffset(offsetMs: number) {
      liricle.offset = offsetMs;
    },
    getLines() {
      return lines;
    },
    sync(time: number) {
      liricle.sync(time, true);
      return findActiveLineIndex(lines, time + liricle.offset / 1000);
    },
  };
}
