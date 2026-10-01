"use client";

import { useEffect, useRef } from "react";

import "./Cursor.css";

/** Anything clickable that the reticle locks onto. */
const INTERACTIVE = "a, button, input, select, textarea, [role='button']";

/** How much of the remaining distance the reticle closes each frame. */
const FOLLOW = 0.2;

/**
 * HUD reticle cursor.
 *
 * A decorative crosshair that trails the real pointer and tightens over anything
 * clickable. It is drawn *next to* the native cursor, never instead of it: there
 * is no `cursor: none` anywhere, so if this component never hydrates, is skipped
 * for reduced motion, or is hidden on a touch device, the site behaves exactly as
 * it did before. One element, one rAF loop, transform-only writes.
 *
 * Visibility is a `data-` attribute rather than React state, so a pointer move
 * never triggers a re-render.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reticle = ref.current;
    if (!reticle) return;

    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    let pointerX = 0;
    let pointerY = 0;
    let drawX = 0;
    let drawY = 0;
    let scale = 1;
    let targetScale = 1;
    let pressed = false;
    let started = false;
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      const node = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
      targetScale = node ? 1.45 : 1;
      reticle.dataset.state = node ? "active" : "idle";

      if (!started) {
        /* Start from the pointer instead of flying in from the top-left corner. */
        started = true;
        drawX = pointerX;
        drawY = pointerY;
        reticle.dataset.visible = "true";
      }
    };

    const onPointerDown = () => {
      pressed = true;
    };

    const onPointerUp = () => {
      pressed = false;
    };

    const onPointerLeave = () => {
      reticle.dataset.visible = "false";
    };

    const loop = () => {
      drawX += (pointerX - drawX) * FOLLOW;
      drawY += (pointerY - drawY) * FOLLOW;
      scale += (targetScale * (pressed ? 0.85 : 1) - scale) * 0.18;
      reticle.style.transform = `translate3d(${drawX.toFixed(2)}px, ${drawY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      frame = requestAnimationFrame(loop);
    };

    /*
     * Nothing is attached until one frame proves the compositor is running. The
     * reticle is positioned by rAF, so in an environment that never paints (some
     * embedded panels stall the frame pipeline outright) it would be stuck in the
     * top-left corner the moment a pointer moved. A callback queued while the tab
     * is hidden simply fires when it is shown again, so this self-heals.
     */
    frame = requestAnimationFrame(() => {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
      frame = requestAnimationFrame(loop);
    });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onPointerLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="hud-cursor" ref={ref} aria-hidden="true" data-visible="false" data-state="idle">
      <span className="hud-cursor__corner hud-cursor__corner--tl" />
      <span className="hud-cursor__corner hud-cursor__corner--tr" />
      <span className="hud-cursor__corner hud-cursor__corner--bl" />
      <span className="hud-cursor__corner hud-cursor__corner--br" />
      <span className="hud-cursor__dot" />
    </div>
  );
}
