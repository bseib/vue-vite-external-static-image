# vue-vite-external-static-image

This repo demonstrates an issue with external image URLs. Or perhaps I just can't figure out the right way to do it.

Here's the setup. `Page1.vue` contains an external image that doesn't exist in this repo**:

```
<img alt="smpte bars" class="logo" src="/img/aaaSMPTE-color-bars.png" />
```

There's a `entry-point-1.ts` file which includes the `Page1.vue` file, and is specified as an `input` in the `vite.config.ts`
config. The `vite.config.ts` also has a rollup config that specifies that PNG to be external:

```
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      input: [
        'src/entry-point-1.ts',
      ],
      external: [
        '/img/aaaSMPTE-color-bars.png',
      ],
      // ...
    }
  },
  // ...
})
```

## Expected Behavior

Run `npm run build`.

After running `npm run build`, the generated `.js` file should *not* attempt to import *anything* for that `<img>` source.
It is expected to be completely external (honoring the rollup config), and should be ignored by any client side code altogether.

## Actual Behavior

The build does not ignore that `<img>` tag, and generates nonsensical import code, i.e.,

File `dist/assets/entry-point-1.e49989cd.js`:
```
[blahblahblah]import n from"../../img/aaaSMPTE-color-bars.png";[blahblahblah]
```

That import breaks at runtime on the client side. That import should not exist in the build output.

----

## ** Why a situation with completely external images?

In this situation there is a large, already existing server with assets (like this `<img>` example) that are already in orbit,
and those assets won't be moved into the newer, smaller vue+vite project. Rather, vue + vite is being integrated into the orbit
of this larger backend, like the backend-integration docs suggest: https://vitejs.dev/guide/backend-integration.html  I.e. the
server injects the appropriate links/files into the document based on the `manifest.json` for that entry point.

The (public directory)[https://vitejs.dev/guide/assets.html#the-public-directory] docs say that you can place an asset in the
special `public` directory, and it will be served from `/` during devlopment. (That's presuming you develop directly with the
vite server only for development. In our case we inject a `<script type="module" src="http://localhost:3000/blah/blah/some-page.ts"></script>`
at the right place in our document, which is being served from `http://localhost:7000/path/to/our/document`.)

Perhaps "public directory" is the secret sauce to making a build be aware of external images...?

No, `npm run build` still generates `js` files containing that erroneous `import` statement, and that still breaks the client
at runtime when you build for production. Furthermore, in our situation, the bigger existing server serves the static image from
its own location (during both development and production), and the special `public` directory (only "special" to vue+vite) is
never actually needed or used by the existing backend server.

### Why two entry points in this example?

With two, then the code-in-common (i.e. `plugin-vue_export-helper.c7c75f4c.js`) is chunked out on its own, leaving very small
entry point files `entry-point-1.e49989cd.js` and `entry-point-2.87e841a1.js`, which are so small you can easily read them as
a human. They are essentially the same otherwise, both demonstrating the same issue.
