# PWA Setup

PWA support has been added to the application using `vite-plugin-pwa`.

## Configuration

The configuration is located in `vite.config.ts`.
The service worker registration strategy is set to `autoUpdate`, meaning the application will automatically update when a new version is deployed and the user refreshes the page.

## Icons

For the PWA to be installable, you **must** provide the following icons in the `public` directory:

- `public/pwa-192x192.png` (192x192 pixels)
- `public/pwa-512x512.png` (512x512 pixels)

You can generate these icons from your logo using tools like [RealFaviconGenerator](https://realfavicongenerator.net/) or similar.

## Testing

To test the PWA:
1. Run `npm run build`
2. Run `npm run preview`
3. Open the application in your browser. You should see an install icon in the address bar (if the icons are present).
