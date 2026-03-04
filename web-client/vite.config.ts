import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      tsDecorators: true
    })
  ],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../../packages/shared'),
      '@types': resolve(__dirname, 'src/types'),
      '@logger': resolve(__dirname, 'src/services/LoggerService'),
      '@mcp-trace/trace-core': resolve(__dirname, '../../cherry-web/packages/mcp-trace/trace-core'),
      '@mcp-trace/trace-web': resolve(__dirname, '../../cherry-web/packages/mcp-trace/trace-web'),
      '@cherrystudio/ai-core/provider': resolve(__dirname, '../../packages/aiCore/src/core/providers'),
      '@cherrystudio/ai-core/built-in/plugins': resolve(__dirname, '../../packages/aiCore/src/core/plugins/built-in'),
      '@cherrystudio/ai-core': resolve(__dirname, '../../packages/aiCore/src'),
      '@cherrystudio/extension-table-plus': resolve(__dirname, '../../packages/extension-table-plus/src'),
      '@cherrystudio/ai-sdk-provider': resolve(__dirname, '../../packages/ai-sdk-provider/src'),
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': resolve(__dirname, 'node_modules/react/jsx-dev-runtime')
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  optimizeDeps: {
    exclude: ['pyodide'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  worker: {
    format: 'es'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    headers: {
      'Cache-Control': 'no-store'
    },
    proxy: {
      '/v1': 'http://localhost:3000'
    }
  }
})
