# vue-vite-external-static-image

This repo demonstrates an issue with external image URLs. Or perhaps I just can't figure out the right way to do it.

Here's the setup. `Page1.vue` contains an external image that doesn't exist in this repo**:

```
<img alt="smpte bars" class="logo" src="/img/aaaSMPTE-color-bars.png" />
```

There's a `entry-point-1.ts` file which includes the `Page1.vue` file, and that entry point file is specified as an
`input` in the `vite.config.ts` config. The `vite.config.ts` also has a rollup config that specifies that PNG to be
external:

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
It is expected to be completely external (honoring the rollup config), and should be completely ignored by any client code.

## Actual Behavior

The build does not ignore that `<img>` tag, and generates an import statement that expects that image file to be in a relative
location, i.e.,

File `dist/assets/entry-point-1.e49989cd.js`:
```
[blahblahblah]import n from"../../img/aaaSMPTE-color-bars.png";[blahblahblah]()=>p("img",{alt:"smpte bars",class:"logo",src:n},null,-1)
```

That import breaks at runtime on the client side. That import should not exist in the build output, and the rendering of the `"img"`
tag should be a static value rather than the imported variable (`n`).

----

## ** Why a situation with completely external images?

This probably does not need explained, but here's the situation:

In this situation there is a large, already existing server with assets (like this `<img>` example) that are already in orbit,
and those assets won't be moved into the newer, smaller vue+vite project. Rather, vue + vite is being integrated into the orbit
of this larger backend, like the backend-integration docs suggest: https://vitejs.dev/guide/backend-integration.html  I.e. the
server injects the appropriate links/files into the document based on the `manifest.json` for that entry point.

Yes, our backend server injects styles and script tags differently based on whether it is in production, or running locally when
serving as a dev environment. When serving as a dev environment, our backend injects a `<script type="module" src="http://localhost:3000/blah/blah/some-page.ts"></script>`
at the right place in our document, while the whole page is being served from `http://localhost:7000/path/to/our/document`.

When in production, our backend server injects several style and script tags into the document `<head>`, based on the information
found in the `manifest.json` that `npm run build` built.

In BOTH cases, static image content is to be served directly from the backend server. I.e. the backend serves static content from
`/img` to fulfill image tags like `<img src="/img/foo/bar.png">`.

### Trying some things...

#### Testing out the "public directory"

The (public directory)[https://vitejs.dev/guide/assets.html#the-public-directory] docs say that you can place an asset in the
special `public` directory, and it will be served from `/` during devlopment. (But that's presuming you serve everything via
the vite server on port 3000, which is not the case.)

Nonetheless, I wanted to see if the presence of a file in the public directory would somehow inform the build such that the
erroneous import statement would not be generated. Maybe some secret sauce here.

⌛⏳...

No, `npm run build` still generates `js` files containing that erroneous `import` statement, and that still breaks the client
at runtime when built for production.

With our existing backend server serving its own static images from `/img` for both development and production, the special `public`
directory has no effect, and is never actually needed or used by the existing backend server.

#### Hacking the generated output to show it working "correctly"

After running `npm run build`, the `dist` directory is filled with the generated output. Then I created a `broken.html` file
in the `dist` dir and manually edited this html file with the style and script tags needed to load the app. It would fail as described.
Screenshot here: https://github.com/bseib/vue-vite-external-static-image/issues/1

Then I copied/edited the `entry-point-1-e49909cd.js` file, renaming it as `hacked-entry-point-1.js`, and changing the link in the
`broken.html` file. I manually edited out the offending import statement in the `hacked` file, and I also edited that render function
to use a static string for the img url. Fired up a little mini webserver with `dist` as the root, and the page served just fine, no errors.

I kept a copy of `broken.html` and `hacked-entry-point-1.js` in the root dir, since `dist` is `.gitignored`. You can copy them into the
`dist` dir to try them out.

### PS -- Why two entry points in this example?

With two, then the code-in-common (i.e. `plugin-vue_export-helper.c7c75f4c.js`) is chunked out on its own, leaving very small
entry point files `entry-point-1.e49989cd.js` and `entry-point-2.87e841a1.js`, which are so small you can easily read them as
a human. They are essentially the same otherwise, both demonstrating the same issue.
