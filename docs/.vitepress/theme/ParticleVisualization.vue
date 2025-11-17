<template>
  <canvas
    ref="canvas"
    :class="['particle-canvas', variant]"
    :style="canvasStyle"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'hero', // 'hero' or 'nav'
  }
})

const canvas = ref(null)
let animationId = null
let particles = []
let interactions = []

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
  } else {
    return {
      position: 'absolute',
      top: '0',
      right: '0',
      width: '300px',
      height: '100%',
      pointerEvents: 'none',
      opacity: '0.6'
    }
  }
})

class Particle {
  constructor(x, y, vx, vy, lifetime = 100) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.lifetime = lifetime
    this.maxLifetime = lifetime
    this.dead = false
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.lifetime--
    if (this.lifetime <= 0) {
      this.dead = true
    }
  }

  draw(ctx, isDark) {
    const alpha = this.lifetime / this.maxLifetime
    ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${alpha * 0.4})` : `rgba(0, 0, 0, ${alpha * 0.4})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x - this.vx * 5, this.y - this.vy * 5)
    ctx.stroke()
  }
}

class Interaction {
  constructor(x, y, numParticles = 3) {
    this.x = x
    this.y = y
    this.age = 0
    this.maxAge = 20
    this.dead = false
    this.particles = []

    // Create secondary particles
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles + (Math.random() - 0.5) * 0.5
      const speed = 1 + Math.random() * 2
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        60 + Math.random() * 40
      ))
    }
  }

  update() {
    this.age++
    if (this.age > this.maxAge) {
      this.dead = true
    }
    this.particles.forEach(p => p.update())
    this.particles = this.particles.filter(p => !p.dead)
  }

  draw(ctx, isDark) {
    const alpha = 1 - (this.age / this.maxAge)

    // Draw interaction point
    ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${alpha * 0.6})` : `rgba(0, 0, 0, ${alpha * 0.6})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, 3 * alpha, 0, Math.PI * 2)
    ctx.fill()

    // Draw secondary particles
    this.particles.forEach(p => p.draw(ctx, isDark))
  }
}

function initAnimation() {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  const width = canvas.value.width = canvas.value.offsetWidth * window.devicePixelRatio
  const height = canvas.value.height = canvas.value.offsetHeight * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const actualWidth = canvas.value.offsetWidth
  const actualHeight = canvas.value.offsetHeight

  let lastInteractionTime = 0
  const interactionInterval = props.variant === 'hero' ? 1500 : 2000

  function animate(timestamp) {
    ctx.clearRect(0, 0, actualWidth, actualHeight)

    const isDark = document.documentElement.classList.contains('dark')

    // Create new interaction periodically
    if (timestamp - lastInteractionTime > interactionInterval) {
      let x, y
      if (props.variant === 'hero') {
        x = actualWidth * 0.3 + Math.random() * actualWidth * 0.4
        y = actualHeight * 0.3 + Math.random() * actualHeight * 0.4
      } else {
        x = 50 + Math.random() * 200
        y = actualHeight * 0.5
      }

      interactions.push(new Interaction(x, y, 2 + Math.floor(Math.random() * 3)))
      lastInteractionTime = timestamp
    }

    // Update and draw interactions
    interactions.forEach(interaction => {
      interaction.update()
      interaction.draw(ctx, isDark)
    })

    // Remove dead interactions
    interactions = interactions.filter(i => !i.dead)

    // Continue animation
    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  initAnimation()

  // Reinitialize on resize
  window.addEventListener('resize', () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    initAnimation()
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.particle-canvas {
  display: block;
}
</style>
