/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      '**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/integration/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/unit/**',
      '**/e2e/**'
    ],
    testTimeout: 30000, // 30 seconds for integration tests
    retry: 2,
    slowTestThreshold: 10000, // 10 seconds
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Integration test specific environment variables
  define: {
    'import.meta.env.VITE_INTEGRATION_TEST': 'true',
  },
})
