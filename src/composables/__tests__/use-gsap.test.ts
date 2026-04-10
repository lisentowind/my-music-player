import { beforeEach, describe, expect, it, vi } from "vitest";

const { gsapFromToMock, gsapToMock } = vi.hoisted(() => ({
  gsapFromToMock: vi.fn(() => ({ kill: vi.fn() })),
  gsapToMock: vi.fn(() => ({ kill: vi.fn() })),
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: gsapFromToMock,
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
    gsapToMock.mockClear();
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
});
