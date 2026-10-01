"use client";

import { useEffect } from "react";

import Lenis from "lenis";
import Snap from "lenis/snap";

import "lenis/dist/lenis.css";

/**
 * Smooth scrolling, tuned to stay out of the way.
 *
 * The library is a wheel/trackpad affordance only. Touch devices keep native
 * inertia, keyboard and scrollbar scrolling are untouched, and nothing is
 * smoothed at all for reduced-motion visitors.
 *
 * Everything that controls the *feel* is in the TUNABLES below, so if a fast
 * flick still overruns or a slow one still feels sticky, it is one number per
 * symptom:
 *
 *   slow scrolling feels laggy          → raise LERP (a proportional follow:
 *                                         0.14 closes 14% of the gap each
 *                                         frame and never overshoots)
 *   fast flicks fly past three sections → lower WHEEL_MULTIPLIER
 *   it keeps correcting after you stop  → raise SNAP_THRESHOLD, or set
 *                                         USE_SNAP_ASSIST to false
 */

/** Proportional follow, frame-rate independent. Lenis's default is 0.1. */
const LERP = 0.14;

/** Applied to raw wheel deltas. Below 1, a flick travels less than the browser would. */
const WHEEL_MULTIPLIER = 0.85;

/**
 * Snap back onto a section boundary when a gesture ends within this distance of
 * one (a percentage of the viewport). Stops *near* a boundary land on it; stops
 * mid-scene are left where they are, because that is where the reading happens.
 */
const SNAP_THRESHOLD = "12%";
const SNAP_DURATION = 0.42;
const SNAP_DEBOUNCE = 500;
const USE_SNAP_ASSIST = true;

/** Anchor moves stop this far short of the target, mirroring `.section`'s `scroll-margin-top: 4.5rem`, so the fixed mobile register pill never covers a heading. */
const ANCHOR_OFFSET = -72;
const ANCHOR_DURATION = 0.7;

/** Matches `--ease-out-quint` in globals.css. */
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/**
 * How long to wait for a first animation frame before concluding the page is not
 * painting, and how many more times to try before giving up for the session.
 */
const FRAME_PROBE_MS = 600;
const FRAME_RETRY_MS = 1500;
const FRAME_MAX_ATTEMPTS = 5;

/**
 * How long after a wheel event the page has to move before we conclude the frame
 * pipeline died mid-session (see the wheel watchdog below).
 */
const WHEEL_STALL_MS = 320;

export default function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    let lenis: Lenis | null = null;
    let snap: Snap | null = null;
    let probeFrame = 0;
    let probeTimer = 0;
    let retryTimer = 0;
    let stallTimer = 0;
    let attempts = 0;

    const teardown = () => {
      window.clearTimeout(probeTimer);
      window.clearTimeout(retryTimer);
      window.clearTimeout(stallTimer);
      if (probeFrame) cancelAnimationFrame(probeFrame);
      probeFrame = 0;
      snap?.destroy();
      lenis?.destroy();
      snap = null;
      lenis = null;
    };

    const create = () => {
      lenis = new Lenis({
        lerp: LERP,
        wheelMultiplier: WHEEL_MULTIPLIER,
        smoothWheel: true,
        /* Phones keep native touch inertia — Lenis never touches touchmove. */
        syncTouch: false,
        touchMultiplier: 1,
        autoRaf: true,
        /*
         * The intro film holds the viewport with `overflow: hidden` on <html>.
         * autoToggle reads that and parks Lenis for the duration, then picks the
         * scroll back up when the film hands over — no manual start/stop dance.
         */
        autoToggle: true,
        /* Anchor links (#about, #register, #top) glide instead of jumping. */
        anchors: {
          offset: ANCHOR_OFFSET,
          duration: ANCHOR_DURATION,
          easing: easeOutQuint,
        },
        /*
         * Belt: Lenis emits `virtual-scroll` for touch events *before* deciding
         * it will not smooth them, so anything listening downstream would react
         * to finger flicks. Only wheel data is ever emitted.
         */
        virtualScroll: (data) => data.event.type.includes("wheel"),
        /*
         * Braces, and a second net for a preference flipped after mount: Lenis
         * itself drops to a 1:1 follow instead of smoothing.
         */
        respectReducedMotion: true,
      });

      /*
       * A proportional assist, not CSS scroll-snap: the browser's snap engine and
       * Lenis's own writes both fight for the scroll position, so this is the
       * section-boundary version of "clean up a landing". Wheel devices only —
       * touch scrolling never routes through the snap plugin.
       */
      if (USE_SNAP_ASSIST && finePointer.matches) {
        const sections = document.querySelectorAll<HTMLElement>(
          "main > .section, main > .hero, .site-footer",
        );

        if (sections.length) {
          snap = new Snap(lenis, {
            type: "proximity",
            distanceThreshold: SNAP_THRESHOLD,
            duration: SNAP_DURATION,
            debounce: SNAP_DEBOUNCE,
            easing: easeOutQuint,
          });
          snap.addElements([...sections]);
        }
      }
    };

    /*
     * Smoothing runs on requestAnimationFrame, so a page that is not painting
     * cannot be smoothed: Lenis would swallow wheel input and never move, and the
     * site would look frozen. (Some embedded preview panels stall the frame
     * pipeline outright, sometimes only for the first moments of a load.) Probe
     * for a frame, hand scrolling back to the browser if none arrives, and keep
     * trying for a while in case the stall was only at startup.
     */
    const probeFrames = () => {
      if (document.visibilityState !== "visible") return;

      let painted = false;
      probeFrame = requestAnimationFrame(() => {
        painted = true;
      });
      probeTimer = window.setTimeout(() => {
        if (painted) return;

        teardown();
        retryLater();
      }, FRAME_PROBE_MS);
    };

    const retryLater = () => {
      if (attempts >= FRAME_MAX_ATTEMPTS) return;
      attempts += 1;
      retryTimer = window.setTimeout(start, FRAME_RETRY_MS);
    };

    const start = () => {
      if (lenis || reducedMotion.matches) return;
      create();
      probeFrames();
    };

    /*
     * Symptom-based safety net for a frame pipeline that stalls *after* the probe
     * passed (bursty embedded panels do this). If the wheel was accepted and the
     * page has not moved at all 320ms later, Lenis ate a flick with nothing to
     * show for it, so smoothing is dropped on the spot and the very next wheel
     * scrolls natively.
     *
     * Every case that can legitimately leave the page still is excluded, so this
     * cannot misfire on a healthy browser: a wheel that cannot move the page in
     * that direction (top, bottom), a horizontal-only trackpad gesture, zoom,
     * the intro film (Lenis is parked then), and anything under a whole pixel.
     */
    const onWheel = (event: WheelEvent) => {
      if (!lenis) return;
      if (Math.abs(event.deltaY) < 1 || event.ctrlKey || event.metaKey) return;
      if (document.documentElement.getAttribute("data-preloader") === "playing") return;
      if (document.documentElement.classList.contains("lenis-stopped")) return;

      const maxScroll =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const atTop = window.scrollY <= 0;
      const atBottom = window.scrollY >= maxScroll - 1;
      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) return;

      const baseline = window.scrollY;
      window.clearTimeout(stallTimer);
      stallTimer = window.setTimeout(() => {
        if (!lenis) return;
        if (Math.abs(window.scrollY - baseline) > 1) return;

        teardown();
        retryLater();
      }, WHEEL_STALL_MS);
    };

    const sync = () => {
      if (reducedMotion.matches) {
        teardown();
        return;
      }

      start();
    };

    sync();
    reducedMotion.addEventListener("change", sync);
    /* Capture phase, so it still sees a wheel Lenis has already claimed. */
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });

    return () => {
      reducedMotion.removeEventListener("change", sync);
      window.removeEventListener("wheel", onWheel, { capture: true });
      teardown();
    };
  }, []);

  return null;
}
