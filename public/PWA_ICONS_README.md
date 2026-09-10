# PWA Icons Required

To complete the PWA setup, you need to add the following icon files to the `public` directory:

## Required Icons

1. **icon-192x192.png** - 192x192 pixels
   - Used for Android home screen icons
   - Should be a square icon with your app logo

2. **icon-512x512.png** - 512x512 pixels
   - Used for Android splash screens and high-resolution displays
   - Should be a square icon with your app logo

## Icon Guidelines

- **Format**: PNG with transparency support
- **Shape**: Square (will be automatically masked on iOS/Android)
- **Design**: 
  - Use your app logo centered
  - Ensure important content is within the center 80% (safe area)
  - Icons should work on both light and dark backgrounds
  - Consider using a solid background color or your brand colors

## Quick Setup

You can generate these icons from your existing logo using:
- Online tools: https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
- Image editing software (Photoshop, GIMP, etc.)
- Command line tools like ImageMagick

## Testing

After adding the icons:
1. Build your app: `npm run build`
2. Start the production server: `npm start`
3. Open the app in a mobile browser (or Chrome DevTools mobile emulation)
4. Look for the "Add to Home Screen" prompt
5. On iOS Safari: Share button → Add to Home Screen
6. On Android Chrome: Menu → Install App / Add to Home Screen

