import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { gsapFromToMock, gsapTimelineMock, gsapToMock, timelineToMock } = vi.hoisted(() => ({
  gsapFromToMock: vi.fn(() => ({ kill: vi.fn() })),
  timelineToMock: vi.fn(),
  gsapTimelineMock: vi.fn(() => ({
    to: timelineToMock,
    kill: vi.fn(),
  })),
  gsapToMock: vi.fn(() => ({ kill: vi.fn() })),
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: gsapFromToMock,
    timeline: gsapTimelineMock,
    to: gsapToMock,
    registerPlugin: vi.fn(),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

describe("use-gsap motion tokens", () => {
  beforeEach(() => {
    gsapFromToMock.mockClear();
    gsapTimelineMock.mockClear();
    gsapToMock.mockClear();
    timelineToMock.mockClear();
  });

  it("为路由、弹层与封面过渡导出统一的 motion token", async () => {
    const { MOTION_TOKENS } = await import("@/composables/use-gsap");

    expect(MOTION_TOKENS.hover.duration).toBeGreaterThan(0.2);
    expect(MOTION_TOKENS.hover.duration).toBeLessThan(0.35);
    expect(MOTION_TOKENS.route.enter.duration).toBeGreaterThan(MOTION_TOKENS.route.leave.duration);
    expect(MOTION_TOKENS.popover.enter.duration).toBeGreaterThan(MOTION_TOKENS.popover.leave.duration);
    expect(MOTION_TOKENS.coverMorph.duration).toBeGreaterThan(0.45);
    expect(MOTION_TOKENS.coverMorph.ease).toBe("power3.inOut");
  });

  it("路由和弹层动画会复用同一套 token，而不是各自写死", async () => {
    const {
      MOTION_TOKENS,
      animatePopoverEnter,
      animatePopoverLeave,
      animateRouteEnter,
      animateRouteLeave,
    } = await import("@/composables/use-gsap");

    const element = document.createElement("div");
    const done = vi.fn();

    animateRouteEnter(element, done);
    expect(gsapFromToMock).toHaveBeenCalledWith(
      element,
      expect.any(Object),
      expect.objectContaining({
        duration: MOTION_TOKENS.route.enter.duration,
        ease: MOTION_TOKENS.route.enter.ease,
      }),
    );

    animateRouteLeave(element, done);
    expect(gsapToMock).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        duration: MOTION_TOKENS.route.leave.duration,
        ease: MOTION_TOKENS.route.leave.ease,
      }),
    );

    animatePopoverEnter(element, done);
    expect(gsapFromToMock).toHaveBeenCalledWith(
      element,
      expect.any(Object),
      expect.objectContaining({
        duration: MOTION_TOKENS.popover.enter.duration,
        ease: MOTION_TOKENS.popover.enter.ease,
      }),
    );

    animatePopoverLeave(element, done);
    expect(gsapToMock).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        duration: MOTION_TOKENS.popover.leave.duration,
        ease: MOTION_TOKENS.popover.leave.ease,
      }),
    );
  });

  it("环境光流动会走 GSAP timeline 的多段漂移，而不是单次 yoyo 往返", async () => {
    const { useGsapAmbientFlow } = await import("@/composables/use-gsap");
    const TestComponent = defineComponent({
      setup() {
        const scopeRef = ref<HTMLElement | null>(null);
        useGsapAmbientFlow(scopeRef, [
          {
            selector: ".ambient",
            x: 18,
            y: -14,
            scale: 1.06,
            opacity: 0.46,
            duration: 20,
          },
        ]);

        return { scopeRef };
      },
      render() {
        return h("div", { ref: "scopeRef" }, [
          h("div", { class: "ambient" }),
        ]);
      },
    });

    const wrapper = mount(TestComponent, {
      attachTo: document.body,
    });

    expect(gsapTimelineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repeat: -1,
      }),
    );
    expect(timelineToMock).toHaveBeenCalledTimes(3);
    expect(gsapToMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        yoyo: true,
      }),
    );

    wrapper.unmount();
  });
});
