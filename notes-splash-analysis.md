# Splash Icon Analysis

- The current splash-icon.png (512x512) has the globe + ConnectWorld text on a mostly transparent bg, but there's still a faint dark rounded-rect outline visible
- The icon.png (1024x1024) is the full app icon with dark background and rounded corners - this is correct for app launcher
- The splash screen on device shows the icon.png with its dark rounded-rect background visible against the dark splash background, creating a visible square outline
- Need to generate a new splash-only image: just the globe with sound waves and "ConnectWorld ai" text, NO rounded-rect frame, on a fully transparent background
- The splash screen config in app.config.ts uses dark background (#000000) so the transparent areas will blend seamlessly
