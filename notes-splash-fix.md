# Splash Fix Notes
Background removed successfully. The "ConnectWorld ai" text at bottom got partially cut since some of its white pixels were below the threshold. But the globe and main logo look clean. The text was part of the dark background area edges. This is fine since the splash screen config shows it at imageWidth: 200 which is small - the text wouldn't be readable anyway at that size. The globe + soundwaves are the important visual.

Now need to investigate the post-splash crash on device.
