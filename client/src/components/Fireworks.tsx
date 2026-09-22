import { useEffect, useRef } from 'react';

interface FireworksProps {
  /** How long new rockets keep launching; the canvas goes idle once the last spark fades. */
  duration?: number;
}

interface Rocket { x: number; y: number; vy: number; targetY: number; color: string }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; decay: number; color: string }

const palette = ['#F5B942', '#38BDF8', '#F472B6', '#A78BFA', '#34D399', '#FB7185', '#FFFFFF'];
const gravity = 0.045;

// Full-screen celebratory fireworks. Decorative only: never blocks clicks and stays off for reduced motion.
export function Fireworks({ duration = 9000 }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const startedAt = performance.now();
    let lastLaunch = 0;
    let frame = 0;

    const launch = () => {
      rockets.push({
        x: width * (0.15 + Math.random() * 0.7),
        y: height,
        vy: -(7 + Math.random() * 3),
        targetY: height * (0.15 + Math.random() * 0.35),
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    };
    const explode = ({ x, y, color }: Rocket) => {
      const count = 70 + Math.floor(Math.random() * 30);
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count;
        const speed = 1.5 + Math.random() * 3.2;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.012 + Math.random() * 0.012,
          color: Math.random() < 0.25 ? '#FFFFFF' : color,
        });
      }
    };

    const tick = (now: number) => {
      const launching = now - startedAt < duration;
      if (launching && now - lastLaunch > 550) {
        launch();
        if (Math.random() < 0.4) launch();
        lastLaunch = now;
      }

      // Fading instead of clearing leaves short trails while the canvas stays transparent.
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = 'rgba(0, 0, 0, 0.22)';
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';

      for (let index = rockets.length - 1; index >= 0; index -= 1) {
        const rocket = rockets[index];
        rocket.y += rocket.vy;
        rocket.vy += 0.06;
        context.fillStyle = rocket.color;
        context.fillRect(rocket.x - 1, rocket.y, 2, 6);
        if (rocket.y <= rocket.targetY || rocket.vy >= -1) {
          explode(rocket);
          rockets.splice(index, 1);
        }
      }
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vx *= 0.985;
        spark.vy = spark.vy * 0.985 + gravity;
        spark.life -= spark.decay;
        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }
        context.globalAlpha = spark.life;
        context.fillStyle = spark.color;
        context.beginPath();
        context.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      if (launching || rockets.length > 0 || sparks.length > 0) {
        frame = requestAnimationFrame(tick);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [duration]);

  return <canvas ref={canvasRef} aria-hidden data-testid="fireworks" className="pointer-events-none fixed inset-0 z-30 size-full" />;
}
