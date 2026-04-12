import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    root: '.',
    build: {
        outDir: 'dist',
        target: 'es2020',
    },
    server: {
        port: 5173,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/__tests__/setup.ts'],
    },
});
