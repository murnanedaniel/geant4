<template>
  <Layout>
    <template #layout-top>
      <ParticleVisualization v-if="isHome" variant="hero" />
    </template>
    <template #nav-bar-content-before>
      <ParticleVisualization variant="nav" />
    </template>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ParticleVisualization from './ParticleVisualization.vue'

const { Layout } = DefaultTheme
const { page } = useData()

const isHome = computed(() => page.value.frontmatter?.layout === 'home')
</script>
