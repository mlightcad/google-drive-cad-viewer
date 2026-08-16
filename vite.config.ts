import { resolve } from 'path'

import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import {
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import svgLoader from 'vite-svg-loader'

export default defineConfig(({ command, mode }) => {
  const plugins = [
    vue(),
    svgLoader(),
    Unocss({
      presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
          scale: 1.2,
          warn: true
        })
      ],
      transformers: [transformerDirectives(), transformerVariantGroup()]
    })
  ]

  if (mode === 'analyze') {
    plugins.push(visualizer() as any)
  }

  if (command === 'build') {
    plugins.push(
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        filter: /\.(js|css|svg|ttf|otf|eot|woff|woff2)$/i
      }) as any,
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        filter: /\.(js|css|svg|ttf|otf|eot|woff|woff2)$/i
      }) as any
    )
  }

  return {
    base: './',
    build: {
      outDir: 'dist',
      modulePreload: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    plugins: plugins as any
  }
})
