import React, { useEffect, useRef } from "react";
import { Engine, Bodies, World, Body } from "matter-js";

/* ─── configurable bits ─────────────────────────────────────── */
const HOT_DOG_COUNT = 5;
const SCALE         = 3;
const SPRITE_SRC    = "/hotdog.png";
const SPEED_BASE    = 3;
const OUT_PAD       = 120;
/* ───────────────────────────────────────────────────────────── */

const SPRITE_W = 64 * SCALE;
const SPRITE_H = 24 * SCALE;
const HALF_W   = SPRITE_W / 2;
const HALF_H   = SPRITE_H / 2;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const HotDogBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const rafRef    = useRef<number>();
  const prefersRM =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── spawn one dog, set it as a sensor so it ignores collisions ── */
  const spawnDog = (engine: Engine, w: number, h: number) => {
    const edge = Math.floor(Math.random() * 4); // 0-3
    let x = 0, y = 0, vx = 0, vy = 0;

    switch (edge) {
      case 0: x = Math.random() * w;           y = -HALF_H - 10;            vx = (Math.random() - 0.5) * SPEED_BASE; vy =  Math.random() * SPEED_BASE + 2;  break; // top
      case 1: x = w + HALF_W + 10;             y = Math.random() * h;       vx = -(Math.random() * SPEED_BASE + 2);  vy = (Math.random() - 0.5) * SPEED_BASE; break; // right
      case 2: x = Math.random() * w;           y =  h + HALF_H + 10;        vx = (Math.random() - 0.5) * SPEED_BASE; vy = -(Math.random() * SPEED_BASE + 2);  break; // bottom
      default:x = -HALF_W - 10;                y = Math.random() * h;       vx =  Math.random() * SPEED_BASE + 2;    vy = (Math.random() - 0.5) * SPEED_BASE;
    }

    const body = Bodies.rectangle(x, y, SPRITE_W, SPRITE_H, {
      isSensor: true,      // ← bodies overlap; no collision response
      friction: 0,
      frictionAir: 0,
     // angularDamping: 0,
    });

    Body.setVelocity(body, { x: vx, y: vy });
    //Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
    World.add(engine.world, body);
  };

  useEffect(() => {
    if (prefersRM) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx    = canvas.getContext("2d")!;
    const engine = Engine.create({ enableSleeping: false });
    engine.gravity.y  = 0;
    engineRef.current = engine;

    let width  = window.innerWidth;
    let height = window.innerHeight;
    canvas.width  = width;
    canvas.height = height;

    const img = new Image();
    img.src   = SPRITE_SRC;

    for (let i = 0; i < HOT_DOG_COUNT; i++) spawnDog(engine, width, height);

    const onResize = () => {
      width  = window.innerWidth;
      height = window.innerHeight;
      canvas.width  = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    let running = true;
    const onVis = () => {
      running = !document.hidden;
      if (running) loop(performance.now());
    };
    document.addEventListener("visibilitychange", onVis);

    let last = performance.now();
    const loop = (t: number) => {
      if (!running) return;
      const dt = clamp(t - last, 0, 16);
      last = t;
      Engine.update(engine, dt);

      ctx.clearRect(0, 0, width, height);

      const toRemove: Body[] = [];
      engine.world.bodies.forEach((b) => {
        const { x, y } = b.position;
        if (x < -OUT_PAD || x > width + OUT_PAD || y < -OUT_PAD || y > height + OUT_PAD) {
          toRemove.push(b);
          return;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(b.angle);
        if (img.complete && img.width) {
          ctx.drawImage(img, -HALF_W, -HALF_H, SPRITE_W, SPRITE_H);
        } else {
          ctx.fillStyle = "#f87171";
          ctx.fillRect(-HALF_W, -HALF_H, SPRITE_W, SPRITE_H);
        }
        ctx.restore();
      });

      toRemove.forEach((b) => {
        World.remove(engine.world, b);
        setTimeout(() => spawnDog(engine, width, height), 500 + Math.random() * 2000);
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(loop);
    };
    img.onload = start;
    img.onerror = start;

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      Engine.clear(engine);
    };
  }, [prefersRM]);

  if (prefersRM) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-fuchsia-600/30 to-indigo-900/60 -z-10" />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none block"
    />
  );
};

export default HotDogBackground;
