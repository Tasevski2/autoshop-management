import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)/,
              priority: 30,
            },
            {
              name: 'router',
              test: /node_modules[\\/]react-router/,
              priority: 25,
            },
            {
              name: 'supabase',
              test: /node_modules[\\/]@supabase/,
              priority: 25,
            },
            {
              name: 'ui-vendor',
              test: /node_modules[\\/](@base-ui|class-variance-authority|clsx|tailwind-merge)/,
              priority: 20,
            },
            {
              name: 'query',
              test: /node_modules[\\/]@tanstack[\\/]react-query/,
              priority: 20,
            },
            {
              name: 'i18n',
              test: /node_modules[\\/](i18next|react-i18next)/,
              priority: 20,
            },
            {
              name: 'charts',
              test: /node_modules[\\/](recharts|d3-|victory)/,
              priority: 15,
            },
            {
              name: 'pdf',
              test: /node_modules[\\/]pdfmake/,
              priority: 15,
            },
            {
              name: 'forms',
              test: /node_modules[\\/](react-hook-form|@hookform|zod)/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
})