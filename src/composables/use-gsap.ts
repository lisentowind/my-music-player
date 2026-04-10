import { onBeforeUnmount, onMounted, type Ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface HoverAnimationOptions {
  hoverY?: number;
  hoverScale?: number;
  pressScale?: number;
  duration?: number;
}

interface ScrollRevealOptions {
  selector: string;
  triggerSelector?: string;
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  start?: string;
  once?: boolean;
}

interface PointerTiltOptions {
  maxRotateX?: number;
  maxRotateY?: number;
  liftY?: number;
  scale?: number;
  duration?: number;
  depthSelector?: string | string[];
  depthOffset?: number;
}

interface AmbientFlowItem {
  selector: string;
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
}

interface AmbientFlowWaypoint {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  borderRadius?: string;
  duration?: number;
}

interface MotionPhase {
  duration: number;
  ease: string;
}

interface CoverMorphRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoverMorphFrame {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  transformOrigin: "top left";
}

interface CoverMorphFrames {
  box: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  from: CoverMorphFrame;
  to: CoverMorphFrame;
}

export const MOTION_TOKENS = {
  hover: {
    y: -2,
    scale: 1.008,
    pressScale: 0.986,
    duration: 0.24,
    ease: "power3.out",
  },
  reveal: {
    distance: 18,
    duration: 0.4,
    stagger: 0.04,
    ease: "power3.out",
  },
  scrollReveal: {
    distance: 26,
    scale: 0.988,
    duration: 0.44,
    stagger: 0.04,
    ease: "power3.out",
    blur: 10,
  },
  pointerTilt: {
    duration: 0.38,
    ease: "power3.out",
  },
  route: {
    enter: {
      duration: 0.32,
      ease: "power3.out",
    } satisfies MotionPhase,
    leave: {
      duration: 0.16,
      ease: "power2.inOut",
    } satisfies MotionPhase,
  },
  popover: {
    enter: {
      duration: 0.28,
      ease: "power3.out",
    } satisfies MotionPhase,
    leave: {
      duration: 0.2,
      ease: "power2.inOut",
    } satisfies MotionPhase,
  },
  dockEnter: {
    duration: 0.42,
    ease: "power3.out",
  } satisfies MotionPhase,
  surfaceSwap: {
    duration: 0.26,
    ease: "power3.out",
    blur: 12,
  },
  coverMorph: {
    duration: 0.46,
    ease: "power3.inOut",
    fadeDuration: 0.16,
    startRadius: 14,
    endRadius: 28,
  },
} as const;

let pluginsRegistered = false;

function canUseDom() {
  return typeof window !== "undefined";
}

function canRunAnimations() {
  return canUseDom()
    && typeof window.requestAnimationFrame === "function"
    && typeof window.cancelAnimationFrame === "function";
}

function prefersReducedMotion() {
  return canUseDom() && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function registerGsapPlugins() {
  if (pluginsRegistered || !canRunAnimations()) {
    return;
  }

  const pluginHost = gsap as typeof gsap & {
    registerPlugin?: (...plugins: unknown[]) => void;
  };

  pluginHost.registerPlugin?.(ScrollTrigger);
  pluginsRegistered = true;
}

function resolveElements(root: HTMLElement, selectors: string[]) {
  return [...new Set(selectors.flatMap(selector => [...root.querySelectorAll<HTMLElement>(selector)]))];
}

function resolveNestedElements(root: HTMLElement, selector?: string | string[]) {
  if (!selector) {
    return [];
  }

  const selectors = Array.isArray(selector) ? selector : [selector];
  return resolveElements(root, selectors);
}

function resolveScrollContainer(root: HTMLElement) {
  return root.closest<HTMLElement>(".app-shell__scroll") ?? undefined;
}

export function resolveCoverMorphFrames(origin: CoverMorphRect, target: CoverMorphRect): CoverMorphFrames {
  const safeTargetWidth = Math.max(target.width, 1);
  const safeTargetHeight = Math.max(target.height, 1);

  return {
    box: {
      left: target.x,
      top: target.y,
      width: target.width,
      height: target.height,
    },
    from: {
      x: origin.x - target.x,
      y: origin.y - target.y,
      scaleX: origin.width / safeTargetWidth,
      scaleY: origin.height / safeTargetHeight,
      transformOrigin: "top left",
    },
    to: {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      transformOrigin: "top left",
    },
  };
}

function attachHoverListeners(element: HTMLElement, options: HoverAnimationOptions = {}) {
  const {
    hoverY = MOTION_TOKENS.hover.y,
    hoverScale = MOTION_TOKENS.hover.scale,
    pressScale = MOTION_TOKENS.hover.pressScale,
    duration = MOTION_TOKENS.hover.duration,
  } = options;

  const onEnter = () => {
    gsap.to(element, {
      y: hoverY,
      scale: hoverScale,
      duration,
      ease: MOTION_TOKENS.hover.ease,
      overwrite: "auto",
      force3D: true,
    });
  };

  const onLeave = () => {
    gsap.to(element, {
      y: 0,
      scale: 1,
      duration,
      ease: MOTION_TOKENS.hover.ease,
      overwrite: "auto",
      force3D: true,
    });
  };

  const onDown = () => {
    gsap.to(element, {
      scale: pressScale,
      duration: 0.14,
      ease: MOTION_TOKENS.hover.ease,
      overwrite: "auto",
      force3D: true,
    });
  };

  const onUp = () => {
    gsap.to(element, {
      scale: hoverScale,
      duration: 0.18,
      ease: MOTION_TOKENS.hover.ease,
      overwrite: "auto",
      force3D: true,
    });
  };

  element.addEventListener("pointerenter", onEnter);
  element.addEventListener("pointerleave", onLeave);
  element.addEventListener("pointerdown", onDown);
  element.addEventListener("pointerup", onUp);

  return () => {
    element.removeEventListener("pointerenter", onEnter);
    element.removeEventListener("pointerleave", onLeave);
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("pointerup", onUp);
  };
}

export function useGsapReveal(scopeRef: Ref<HTMLElement | null>, selectors: string[], delay = 0) {
  onMounted(() => {
    const scope = scopeRef.value;
    if (!scope || !canRunAnimations() || prefersReducedMotion()) {
      return;
    }

    const targets = resolveElements(scope, selectors);
    if (targets.length === 0) {
      return;
    }

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: MOTION_TOKENS.reveal.distance, scale: 0.992 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: MOTION_TOKENS.reveal.duration,
        delay,
        stagger: MOTION_TOKENS.reveal.stagger,
        ease: MOTION_TOKENS.reveal.ease,
        clearProps: "opacity,visibility,transform",
      },
    );
  });
}

export function useGsapAmbientFlow(scopeRef: Ref<HTMLElement | null>, items: AmbientFlowItem[]) {
  const runtimes: Array<{ tween?: { kill?: () => void } }> = [];
  const pendingTimers: number[] = [];

  const ambientShapes = [
    "60% 40% 54% 46% / 42% 58% 44% 56%",
    "46% 54% 42% 58% / 56% 44% 60% 40%",
    "54% 46% 58% 42% / 48% 52% 40% 60%",
    "44% 56% 52% 48% / 60% 40% 58% 42%",
  ] as const;

  const randomBetween = (min: number, max: number) => {
    if (min === max) {
      return min;
    }

    return min + ((max - min) * Math.random());
  };

  const scheduleAmbientStep = (
    target: HTMLElement,
    item: AmbientFlowItem,
    runtime: { tween?: { kill?: () => void } },
  ) => {
    const travelX = Math.abs(item.x ?? 0);
    const travelY = Math.abs(item.y ?? 0);
    const targetScale = item.scale ?? 1.02;
    const baseOpacity = item.opacity;
    const baseDuration = item.duration ?? 18;

    const nextStep: AmbientFlowWaypoint = {
      x: randomBetween(-travelX, travelX),
      y: randomBetween(-travelY, travelY),
      scale: randomBetween(1, targetScale),
      opacity: baseOpacity === undefined
        ? undefined
        : randomBetween(Math.max(0, baseOpacity - 0.1), Math.min(1, baseOpacity + 0.06)),
      borderRadius: ambientShapes[Math.floor(Math.random() * ambientShapes.length)],
      duration: randomBetween(baseDuration * 0.78, baseDuration * 1.18),
    };

    const tween = gsap.to(target, {
      ...nextStep,
      ease: "sine.inOut",
      force3D: true,
      overwrite: "auto",
      onComplete: () => {
        const timeoutId = window.setTimeout(() => {
          const timerIndex = pendingTimers.indexOf(timeoutId);
          if (timerIndex >= 0) {
            pendingTimers.splice(timerIndex, 1);
          }
          scheduleAmbientStep(target, item, runtime);
        }, randomBetween(320, 1400));
        pendingTimers.push(timeoutId);
      },
    });

    runtime.tween = tween;
  };

  onMounted(() => {
    const scope = scopeRef.value;
    if (!scope || !canRunAnimations() || prefersReducedMotion()) {
      return;
    }

    for (const item of items) {
      const targets = resolveElements(scope, [item.selector]);
      for (const target of targets) {
        const runtime: { tween?: { kill?: () => void } } = {};
        runtimes.push(runtime);
        const startDelay = Math.max(0, item.delay ?? 0) * 1000;
        if (startDelay > 0) {
          const timeoutId = window.setTimeout(() => {
            const timerIndex = pendingTimers.indexOf(timeoutId);
            if (timerIndex >= 0) {
              pendingTimers.splice(timerIndex, 1);
            }
            scheduleAmbientStep(target, item, runtime);
          }, startDelay);
          pendingTimers.push(timeoutId);
        } else {
          scheduleAmbientStep(target, item, runtime);
        }
      }
    }
  });

  onBeforeUnmount(() => {
    for (const runtime of runtimes) {
      runtime.tween?.kill?.();
    }
    pendingTimers.splice(0).forEach(timeoutId => window.clearTimeout(timeoutId));
    runtimes.length = 0;
  });
}

export function useGsapHover(elementRef: Ref<HTMLElement | null>, options: HoverAnimationOptions = {}) {
  const {
    hoverY = MOTION_TOKENS.hover.y,
    hoverScale = MOTION_TOKENS.hover.scale,
    pressScale = MOTION_TOKENS.hover.pressScale,
    duration = MOTION_TOKENS.hover.duration,
  } = options;

  let element: HTMLElement | null = null;
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    element = elementRef.value;
    if (!element || !canRunAnimations() || prefersReducedMotion()) {
      return;
    }
    cleanup = attachHoverListeners(element, {
      hoverY,
      hoverScale,
      pressScale,
      duration,
    });
  });

  onBeforeUnmount(() => {
    if (!element) {
      return;
    }

    if (cleanup) {
      cleanup();
    }
  });
}

export function useGsapHoverTargets(
  scopeRef: Ref<HTMLElement | null>,
  selectors: string[],
  options: HoverAnimationOptions = {},
) {
  const cleanups: Array<() => void> = [];

  onMounted(() => {
    const scope = scopeRef.value;
    if (!scope || !canRunAnimations() || prefersReducedMotion()) {
      return;
    }

    const targets = resolveElements(scope, selectors);
    targets.forEach((target) => {
      cleanups.push(attachHoverListeners(target, options));
    });
  });

  onBeforeUnmount(() => {
    cleanups.splice(0).forEach(cleanup => cleanup());
  });
}

export function useGsapScrollReveal(scopeRef: Ref<HTMLElement | null>, groups: ScrollRevealOptions[]) {
  const animations: Array<{ kill?: () => void }> = [];

  onMounted(() => {
    const scope = scopeRef.value;
    if (!scope || !canRunAnimations() || prefersReducedMotion()) {
      return;
    }

    registerGsapPlugins();
    const scroller = resolveScrollContainer(scope);

    groups.forEach((group) => {
      const targets = resolveElements(scope, [group.selector]);
      if (targets.length === 0) {
        return;
      }

      const trigger =
        (group.triggerSelector && scope.querySelector<HTMLElement>(group.triggerSelector))
        ?? targets[0];

      const tween = gsap.fromTo(
        targets,
        {
          autoAlpha: 0,
          x: group.x ?? 0,
          y: group.y ?? MOTION_TOKENS.scrollReveal.distance,
          scale: group.scale ?? MOTION_TOKENS.scrollReveal.scale,
          filter: `blur(${MOTION_TOKENS.scrollReveal.blur}px)`,
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: group.duration ?? MOTION_TOKENS.scrollReveal.duration,
          delay: group.delay ?? 0,
          stagger: group.stagger ?? MOTION_TOKENS.scrollReveal.stagger,
          ease: MOTION_TOKENS.scrollReveal.ease,
          clearProps: "opacity,visibility,transform,filter",
          scrollTrigger: {
            scroller,
            trigger,
            start: group.start ?? "top bottom-=12%",
            once: group.once ?? true,
          },
        },
      );

      animations.push(tween);
    });

    if (animations.length > 0) {
      window.requestAnimationFrame(() => {
        const refresh = (ScrollTrigger as typeof ScrollTrigger & {
          refresh?: () => void;
        }).refresh;
        refresh?.();
      });
    }
  });

  onBeforeUnmount(() => {
    animations.splice(0).forEach(animation => animation.kill?.());
  });
}

export function useGsapPointerTilt(elementRef: Ref<HTMLElement | null>, options: PointerTiltOptions = {}) {
  const {
    maxRotateX = 8,
    maxRotateY = 10,
    liftY = -8,
    scale = 1.015,
    duration = MOTION_TOKENS.pointerTilt.duration,
    depthSelector,
    depthOffset = 12,
  } = options;

  let element: HTMLElement | null = null;
  let onEnter: ((event: PointerEvent) => void) | null = null;
  let onMove: ((event: PointerEvent) => void) | null = null;
  let onLeave: (() => void) | null = null;
  let onDown: (() => void) | null = null;
  let onUp: (() => void) | null = null;

  onMounted(() => {
    element = elementRef.value;
    if (!element || !canRunAnimations() || prefersReducedMotion()) {
      return;
    }

    const depthTargets = resolveNestedElements(element, depthSelector);

    const animateCard = (vars: Record<string, number>) => {
      gsap.to(element, {
        ...vars,
        duration,
        ease: MOTION_TOKENS.pointerTilt.ease,
        overwrite: "auto",
        transformPerspective: 1200,
        transformOrigin: "center center",
        force3D: true,
      });
    };

    const animateDepth = (vars: Record<string, number>) => {
      if (depthTargets.length === 0) {
        return;
      }

      gsap.to(depthTargets, {
        ...vars,
        duration: duration + 0.04,
        ease: MOTION_TOKENS.pointerTilt.ease,
        overwrite: "auto",
        force3D: true,
      });
    };

    onEnter = (event) => {
      onMove?.(event);
    };

    onMove = (event) => {
      const rect = element!.getBoundingClientRect();
      const pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      const pointerY = (event.clientY - rect.top) / rect.height - 0.5;

      animateCard({
        rotateX: pointerY * -maxRotateX,
        rotateY: pointerX * maxRotateY,
        y: liftY,
        scale,
      });

      animateDepth({
        x: pointerX * depthOffset,
        y: pointerY * depthOffset,
      });
    };

    onLeave = () => {
      animateCard({
        rotateX: 0,
        rotateY: 0,
        y: 0,
        scale: 1,
      });

      animateDepth({
        x: 0,
        y: 0,
      });
    };

    onDown = () => {
      animateCard({
        scale: scale - 0.02,
      });
    };

    onUp = () => {
      animateCard({
        scale,
      });
    };

    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointerup", onUp);
  });

  onBeforeUnmount(() => {
    if (!element) {
      return;
    }

    if (onEnter) {
      element.removeEventListener("pointerenter", onEnter);
    }
    if (onMove) {
      element.removeEventListener("pointermove", onMove);
    }
    if (onLeave) {
      element.removeEventListener("pointerleave", onLeave);
    }
    if (onDown) {
      element.removeEventListener("pointerdown", onDown);
    }
    if (onUp) {
      element.removeEventListener("pointerup", onUp);
    }
  });
}

export function animateRouteEnter(element: Element, done: () => void) {
  gsap.fromTo(
    element,
    { autoAlpha: 0, y: 20, scale: 0.994 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: MOTION_TOKENS.route.enter.duration,
      ease: MOTION_TOKENS.route.enter.ease,
      clearProps: "opacity,visibility,transform",
      onComplete: done,
    },
  );
}

export function animateRouteLeave(element: Element, done: () => void) {
  gsap.to(element, {
    autoAlpha: 0,
    y: -10,
    scale: 0.996,
    duration: MOTION_TOKENS.route.leave.duration,
    ease: MOTION_TOKENS.route.leave.ease,
    clearProps: "opacity,visibility,transform",
    onComplete: done,
  });
}

export function animatePopoverEnter(element: Element, done: () => void) {
  gsap.fromTo(
    element,
    { autoAlpha: 0, y: -8, scale: 0.972, transformOrigin: "top right" },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: MOTION_TOKENS.popover.enter.duration,
      ease: MOTION_TOKENS.popover.enter.ease,
      clearProps: "opacity,visibility,transform",
      onComplete: done,
    },
  );
}

export function animatePopoverLeave(element: Element, done: () => void) {
  gsap.to(element, {
    autoAlpha: 0,
    y: -6,
    scale: 0.986,
    duration: MOTION_TOKENS.popover.leave.duration,
    ease: MOTION_TOKENS.popover.leave.ease,
    onComplete: done,
  });
}
