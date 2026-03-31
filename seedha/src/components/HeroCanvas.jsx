import { useEffect, useRef } from 'react'

export default function HeroCanvas() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = canvas.offsetWidth
    const H = 130
    canvas.width  = W
    canvas.height = H

    /* ── Road network ── */
    const nodes = [
      { x: 0.06, y: 0.55 }, { x: 0.20, y: 0.48 }, { x: 0.36, y: 0.44 },
      { x: 0.50, y: 0.54 }, { x: 0.64, y: 0.38 }, { x: 0.76, y: 0.60 },
      { x: 0.91, y: 0.46 }, { x: 0.44, y: 0.74 }, { x: 0.62, y: 0.80 },
      { x: 0.28, y: 0.28 }, { x: 0.72, y: 0.24 }, { x: 0.14, y: 0.76 },
    ]
    const edges = [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],
      [3,7],[7,8],[1,9],[4,10],[0,11],[11,7],[9,2],[10,6],[5,8],
    ]

    /* ── Particles along edges ── */
    const particles = []
    edges.forEach(([a, b]) => {
      const count = Math.floor(Math.random() * 2) + 1
      for (let k = 0; k < count; k++) {
        particles.push({
          a, b,
          t:     Math.random(),
          speed: (0.0015 + Math.random() * 0.0025) * (Math.random() < 0.5 ? 1 : -1),
          isLime: Math.random() < 0.6,
          size:   Math.random() * 1.4 + 0.7,
        })
      }
    })

    /* ── Buildings ── */
    const BLDG_COLS  = ['#111826', '#0f1520', '#141d30', '#0d1422']
    const LIGHT_COLS = ['#a8ff3e', '#5ba8ff', '#ff8940']
    const buildings = Array.from({ length: 9 }, () => ({
      x:        0.04 + Math.random() * 0.92,
      y:        0.04 + Math.random() * 0.42,
      w:        11   + Math.random() * 20,
      h:        7    + Math.random() * 18,
      col:      BLDG_COLS[Math.floor(Math.random() * BLDG_COLS.length)],
      lightCol: LIGHT_COLS[Math.floor(Math.random() * LIGHT_COLS.length)],
      hasLight: Math.random() < 0.55,
      phase:    Math.random() * Math.PI * 2,
    }))

    let t = 0

    function draw() {
      t += 0.007
      ctx.clearRect(0, 0, W, H)

      /* Background */
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0a0c18')
      bg.addColorStop(1, '#070910')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      /* Subtle grid */
      ctx.strokeStyle = 'rgba(255,255,255,0.022)'
      ctx.lineWidth   = 0.5
      for (let i = 0; i < W; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      }
      for (let j = 0; j < H; j += 30) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke()
      }

      /* Buildings */
      buildings.forEach(b => {
        const bx = b.x * W, by = b.y * H
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(bx + 3, by + 3, b.w, b.h)
        // body
        ctx.fillStyle   = b.col
        ctx.strokeStyle = 'rgba(255,255,255,0.055)'
        ctx.lineWidth   = 0.5
        ctx.fillRect(bx, by, b.w, b.h)
        ctx.strokeRect(bx, by, b.w, b.h)
        // window glow
        if (b.hasLight) {
          const pulse = 0.45 + 0.55 * Math.sin(t * 1.8 + b.phase)
          ctx.globalAlpha = pulse * 0.85
          ctx.fillStyle   = b.lightCol
          ctx.fillRect(bx + 3,        by + 3, 3, 3)
          ctx.fillRect(bx + b.w - 6,  by + 3, 3, 3)
          if (b.h > 12) ctx.fillRect(bx + 3, by + b.h - 7, 3, 3)
          ctx.globalAlpha = 1
        }
      })

      /* Road edges */
      edges.forEach(([a, b]) => {
        const ax = nodes[a].x * W, ay = nodes[a].y * H
        const bx = nodes[b].x * W, by = nodes[b].y * H
        ctx.strokeStyle = 'rgba(255,255,255,0.055)'
        ctx.lineWidth   = 3
        ctx.lineCap     = 'round'
        ctx.setLineDash([])
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
        // centre dashes
        ctx.strokeStyle = 'rgba(255,255,255,0.035)'
        ctx.lineWidth   = 0.7
        ctx.setLineDash([5, 8])
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
        ctx.setLineDash([])
      })

      /* Nodes */
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x * W, n.y * H, 2.2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.10)'
        ctx.fill()
      })

      /* Particles */
      particles.forEach(p => {
        p.t += p.speed
        if (p.t > 1) p.t = 0
        if (p.t < 0) p.t = 1
        const ax = nodes[p.a].x * W, ay = nodes[p.a].y * H
        const bx = nodes[p.b].x * W, by = nodes[p.b].y * H
        const px = ax + (bx - ax) * p.t
        const py = ay + (by - ay) * p.t
        const rgb = p.isLime ? '168,255,62' : '91,168,255'
        // glow halo
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 5)
        glow.addColorStop(0, `rgba(${rgb},0.8)`)
        glow.addColorStop(1, `rgba(${rgb},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, p.size * 5, 0, Math.PI * 2)
        ctx.fill()
        // core dot
        ctx.fillStyle = `rgba(${rgb},1)`
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      /* Moving scan line */
      const scanX = (t * 55) % (W + 60) - 30
      const scanG = ctx.createLinearGradient(scanX - 40, 0, scanX + 30, 0)
      scanG.addColorStop(0, 'rgba(168,255,62,0)')
      scanG.addColorStop(0.5, 'rgba(168,255,62,0.032)')
      scanG.addColorStop(1, 'rgba(168,255,62,0)')
      ctx.fillStyle = scanG
      ctx.fillRect(0, 0, W, H)

      /* Top + bottom fade */
      const vTop = ctx.createLinearGradient(0, 0, 0, 28)
      vTop.addColorStop(0, 'rgba(7,9,16,0.95)')
      vTop.addColorStop(1, 'rgba(7,9,16,0)')
      ctx.fillStyle = vTop
      ctx.fillRect(0, 0, W, 28)

      const vBot = ctx.createLinearGradient(0, H - 28, 0, H)
      vBot.addColorStop(0, 'rgba(7,9,16,0)')
      vBot.addColorStop(1, 'rgba(7,9,16,1)')
      ctx.fillStyle = vBot
      ctx.fillRect(0, H - 28, W, 28)

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    /* Resize observer */
    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth
      canvas.width = W
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="hero-wrap">
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Logo overlay */}
      <div className="hero-logo">
        <div className="logo-icon-wrap">
          <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="46" height="46" rx="12" fill="#0d1422" />
            <rect width="46" height="46" rx="12" fill="url(#iconGrad)" opacity="0.55" />
            {/* Fork road */}
            <path d="M23 37 L23 23"         stroke="#a8ff3e" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23 23 L14.5 13.5"     stroke="#a8ff3e" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23 23 L31.5 13.5"     stroke="#5ba8ff" strokeWidth="2"   strokeLinecap="round" strokeDasharray="3 2.5" />
            {/* Centre node */}
            <circle cx="23" cy="23" r="2.2" fill="white" opacity="0.9" />
            {/* Fuel glow destination */}
            <circle cx="14.5" cy="13.5" r="3"   fill="#a8ff3e" />
            <circle cx="14.5" cy="13.5" r="5.5" fill="#a8ff3e" opacity="0.18" />
            {/* Shortest destination */}
            <circle cx="31.5" cy="13.5" r="2.5" fill="#5ba8ff" opacity="0.75" />
            {/* Start pin bottom */}
            <circle cx="23" cy="37" r="2"   fill="#a8ff3e" opacity="0.6" />
            <defs>
              <linearGradient id="iconGrad" x1="0" y1="0" x2="46" y2="46" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a8ff3e" stopOpacity="0.35" />
                <stop offset="1" stopColor="#5ba8ff" stopOpacity="0.12" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="logo-text">
          <div className="logo-name">
            Seedha <em>Rasta</em>
          </div>
          <div className="logo-tagline">⛽ Fuel-Aware Smart Routing</div>
        </div>
      </div>
    </div>
  )
}