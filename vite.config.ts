import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// El navegador usa un mismo origen; Vite reenvía las peticiones al backend.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: Object.fromEntries(
            ['/api', '/usuarios', '/perfiles', '/huespedes', '/habitaciones'].map((ruta) => [
                ruta,
                {
                    target: process.env.HOTEL_API_TARGET || 'http://127.0.0.1:8080',
                    changeOrigin: true,
                },
            ]),
        ),
    },
});
