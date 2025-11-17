<template>
  <canvas
    ref="canvas"
    :class="['particle-canvas', variant]"
    :style="canvasStyle"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const VARIANT_CONFIG = {
  hero: {
    initialParticles: 5,
    decayProbability: 0.018,
    daughterRange: [2, 3],
    maxGeneration: 2,
    baseLifetime: 320,
    spread: Math.PI / 3,
    boundingBox: (width, height) => ({
      x: width * 0.05,
      y: height * 0.1,
      w: width * 0.9,
      h: height * 0.8
    })
  },
  nav: {
    initialParticles: 2,
    decayProbability: 0.035,
    daughterRange: [2, 2],
    maxGeneration: 2,
    baseLifetime: 180,
    spread: Math.PI / 4,
    boundingBox: (width, height) => ({
      x: width * 0.1,
      y: height * 0.2,
      w: width * 0.8,
      h: height * 0.6
    })
  }
}

const props = defineProps({
  variant: {
    type: String,
    default: 'hero'
  }
})

const canvas = ref(null)
let animationId = null
let resizeHandler = null
let particles = []

const canvasStyle = computed(() => {
  if (props.variant === 'hero') {
    return {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '0'
    }
  }
  return {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '300px',
    height: '100%',
    pointerEvents: 'none',
    opacity: '0.7'
  }
})

class TrackParticle {
  constructor({
    x,
    y,
    vx,
    vy,
    lifetime,
    generation,
    colorShift
  }) {
    this.x = x
    this.y = y
    this.originX = x
    this.originY = y
    this.vx = vx
    this.vy = vy
    this.maxLifetime = lifetime
    this.lifetime = lifetime
    this.generation = generation
    this.colorShift = colorShift
    this.hasDecayed = false
  }

  get momentum() {
    return Math.hypot(this.vx, this.vy)
  }

  get lifeProgress() {
    return 1 - this.lifetime / this.maxLifetime
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.lifetime--
  }

  draw(ctx, isDark) {
    const alpha = Math.max(0, this.lifetime / this.maxLifetime)
    if (alpha <= 0) return

    // Grey trajectory from origin to current position, fades with particle
    const tailAlpha = alpha * 0.5
    const grey = isDark ? 210 : 80

    ctx.strokeStyle = `rgba(${grey}, ${grey}, ${grey}, ${tailAlpha})`
    ctx.lineWidth = Math.max(0.5, 1.6 - this.generation * 0.3)
    ctx.beginPath()
    ctx.moveTo(this.originX, this.originY)
    ctx.lineTo(this.x, this.y)
    ctx.stroke()

    // Very short colored head (raindrop) at the tip
    const baseColor = isDark ? 220 : 60
    const hue = (baseColor + this.colorShift * 120) % 360
    ctx.strokeStyle = `hsla(${hue}, 95%, ${isDark ? 75 : 45}%, ${alpha})`
    ctx.lineWidth = Math.max(0.8, 1.8 - this.generation * 0.3)
    const headLength = 5
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x - this.vx * headLength, this.y - this.vy * headLength)
    ctx.stroke()
  }

  get dead() {
    return this.lifetime <= 0
  }
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

// Sample log-uniformly between min and max (min > 0)
function randomLogUniform(min, max) {
  const logMin = Math.log(min)
  const logMax = Math.log(max)
  return Math.exp(logMin + Math.random() * (logMax - logMin))
}

function spawnInitialParticles(bounds, config) {
  for (let i = 0; i < config.initialParticles; i++) {
    const angle = Math.random() * Math.PI * 2
    // Log-uniform speed (for particle simulation, this gives more "slow" and some "fast" particles)
    const speed = randomLogUniform(0.5, 10.0)
    const lifetime = config.baseLifetime * (0.8 + Math.random() * 0.4)
    const startX = bounds.x + bounds.w * Math.random()
    const startY = bounds.y + bounds.h * Math.random()

    particles.push(new TrackParticle({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifetime,
      generation: 0,
      colorShift: Math.random()
    }))
  }
}

function spawnDaughters(parent, config) {
  const [minDaughters, maxDaughters] = config.daughterRange
  const daughterCount = Math.max(2, Math.floor(randomInRange(minDaughters, maxDaughters + 1)))

  const daughters = []
  let remainingVx = parent.vx
  let remainingVy = parent.vy
  const baseAngle = Math.atan2(parent.vy, parent.vx)
  const parentMomentum = parent.momentum || 0.2

  for (let i = 0; i < daughterCount; i++) {
    const isLast = i === daughterCount - 1
    let vx
    let vy

    if (isLast) {
      vx = remainingVx
      vy = remainingVy
    } else {
      const fraction = Math.max(0.15, Math.random() * 0.6)
      const angleJitter = (Math.random() - 0.5) * config.spread
      const speed = Math.max(0.2, parentMomentum * fraction)
      vx = Math.cos(baseAngle + angleJitter) * speed
      vy = Math.sin(baseAngle + angleJitter) * speed
      remainingVx -= vx
      remainingVy -= vy
    }

    if (Math.abs(vx) + Math.abs(vy) < 0.01) {
      const fallbackAngle = baseAngle + (Math.random() - 0.5) * config.spread
      vx = Math.cos(fallbackAngle) * 0.4
      vy = Math.sin(fallbackAngle) * 0.4
    }

    daughters.push(new TrackParticle({
      x: parent.x,
      y: parent.y,
      vx,
      vy,
      lifetime: parent.maxLifetime * (0.6 + Math.random() * 0.4),
      generation: parent.generation + 1,
      colorShift: Math.min(1, Math.max(0, parent.colorShift + (Math.random() - 0.5) * 0.2))
    }))
  }

  return daughters
}

function initAnimation() {
  if (!canvas.value) return

  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  const ctx = canvas.value.getContext('2d')
  const width = canvas.value.width = canvas.value.offsetWidth * window.devicePixelRatio
  const height = canvas.value.height = canvas.value.offsetHeight * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const actualWidth = canvas.value.offsetWidth
  const actualHeight = canvas.value.offsetHeight

  if (!actualWidth || !actualHeight) {
    requestAnimationFrame(initAnimation)
    return
  }

  const config = VARIANT_CONFIG[props.variant] || VARIANT_CONFIG.hero
  const bounds = config.boundingBox(actualWidth, actualHeight)

  particles = []
  spawnInitialParticles(bounds, config)

  let lastTimestamp = 0

  function animate(timestamp) {
    const delta = Math.min(60, timestamp - lastTimestamp || 16)
    lastTimestamp = timestamp

    ctx.clearRect(0, 0, actualWidth, actualHeight)
    const isDark = document.documentElement.classList.contains('dark')

    const newParticles = []

    particles.forEach(particle => {
      particle.update()

      const decayChance = 1 - Math.exp(-config.decayProbability * (delta / 16))
      if (!particle.hasDecayed &&
        particle.generation < config.maxGeneration &&
        Math.random() < decayChance) {
        particle.hasDecayed = true
        newParticles.push(...spawnDaughters(particle, config))
        particle.lifetime = Math.min(particle.lifetime, particle.maxLifetime * 0.4)
      }

      particle.draw(ctx, isDark)
    })

    particles = particles
      .filter(p => !p.dead)
      .concat(newParticles)

    // Maintain population by respawning primaries if we run low
    if (particles.filter(p => p.generation === 0).length < config.initialParticles) {
      spawnInitialParticles(bounds, config)
    }

    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  initAnimation()
  resizeHandler = () => {
    if (animationId) cancelAnimationFrame(animationId)
    initAnimation()
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})
</script>

<style scoped>
.particle-canvas {
  display: block;
}
</style>