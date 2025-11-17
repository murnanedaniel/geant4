// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import { onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vitepress'
import mermaid from 'mermaid'
import './custom.css'

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()

    const renderMermaidDiagrams = async () => {
      if (typeof window === 'undefined') return

      await nextTick()

      // Initialize Mermaid with physics-themed colors
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          // Physics-inspired color palette
          primaryColor: '#2e3856',           // Deep navy background
          primaryTextColor: '#f5f5f5',       // Light text
          primaryBorderColor: '#4a90e2',     // Cherenkov blue borders
          lineColor: '#7cb9ff',              // Cherenkov blue lines
          secondaryColor: '#00d4aa',         // Detector green
          tertiaryColor: '#1a1f3a',          // Deep space background
          mainBkg: '#2e3856',
          secondBkg: '#1a1f3a',
          nodeBorder: '#4a90e2',
          clusterBkg: '#141827',
          clusterBorder: '#4a90e2',
          defaultLinkColor: '#7cb9ff',
          titleColor: '#f5f5f5',
          edgeLabelBackground: '#1a1f3a',
          // Technical aesthetic
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '14px'
        },
        securityLevel: 'loose'
      })

      // Find all mermaid code blocks
      const mermaidBlocks = document.querySelectorAll('.vp-doc pre.mermaid, .vp-doc .language-mermaid pre')

      mermaidBlocks.forEach((block, index) => {
        const code = block.textContent || ''

        // Create a div to hold the rendered diagram
        const mermaidDiv = document.createElement('div')
        mermaidDiv.classList.add('mermaid')
        mermaidDiv.textContent = code

        //Replace the code block with the mermaid div
        const parent = block.parentElement
        if (parent) {
          parent.replaceWith(mermaidDiv)
        }
      })

      // Run Mermaid
      try {
        await mermaid.run({
          querySelector: '.vp-doc .mermaid'
        })
      } catch (e) {
        console.error('Mermaid rendering error:', e)
      }
    }

    onMounted(() => {
      renderMermaidDiagrams()
    })

    // Re-render on route changes
    watch(() => route.path, () => {
      setTimeout(renderMermaidDiagrams, 100)
    })
  }
}
