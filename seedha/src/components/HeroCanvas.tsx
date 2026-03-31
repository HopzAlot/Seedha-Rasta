import { useEffect, useRef } from "react";

export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;

    canvas.width = W;
    canvas.height = H;

    // Graph nodes
    const nodes = [
      { x: 0.1, y: 0.6 },
      { x: 0.3, y: 0.5 },
      { x: 0.5, y: 0.6 },
      { x: 0.7, y: 0.4 },
      { x: 0.9, y: 0.55 },
      { x: 0.4, y: 0.75 },
      { x: 0.6, y: 0.8 },
    ];

    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
    ];

    const particles = edges.map(([a, b]) => ({
      a,
      b,
      t: Math.random(),
      speed: 0.002 + Math.random() * 0.003,
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // background
      ctx.fillStyle = "#0b0f1a";
      ctx.fillRect(0, 0, W, H);

      // edges
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;

      edges.forEach(([a, b]) => {
        const ax = nodes[a].x * W;
        const ay = nodes[a].y * H;
        const bx = nodes[b].x * W;
        const by = nodes[b].y * H;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      });

      // nodes
      nodes.forEach((n) => {
        const x = n.x * W;
        const y = n.y * H;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fill();
      });

      // particles (cars)
      particles.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        const a = nodes[p.a];
        const b = nodes[p.b];

        const x = (a.x + (b.x - a.x) * p.t) * W;
        const y = (a.y + (b.y - a.y) * p.t) * H;

        // glow
        const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
        g.addColorStop(0, "rgba(168,255,62,0.8)");
        g.addColorStop(1, "rgba(168,255,62,0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = "#a8ff3e";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    draw();

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}