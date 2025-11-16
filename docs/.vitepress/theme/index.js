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

      // Initialize Mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#4ecdc4',
          primaryTextColor: '#fff',
          primaryBorderColor: '#45b7d1',
          lineColor: '#96ceb4',
          secondaryColor: '#ff6b6b',
          tertiaryColor: '#f7fff7'
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
