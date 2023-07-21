import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';

// https://astro.build/config
export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'js/app.js',
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(-1);
            if (/css|scss/i.test(extType)) {
              return '[ext]/style[extname]';
            } else {
              return '[ext]/[name][extname]';
            }
          },
        },
      },
      minify: false,
    },
  },
  server: {
    host: true,
  },
  integrations: [relativeLinks()],
});
