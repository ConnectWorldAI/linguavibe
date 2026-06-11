# ElevenLabs React Native SDK Research

## Installation
```bash
npx expo install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc @config-plugins/react-native-webrtc @livekit/react-native-expo-plugin livekit-client
```

## Key Points
- Requires development builds (NOT compatible with Expo Go)
- Uses LiveKit WebRTC under the hood
- API identical to web React SDK
- Needs ConversationProvider wrapper
- Needs microphone permissions (iOS + Android)

## Expo Plugins Required
- @livekit/react-native-expo-plugin
- @config-plugins/react-native-webrtc

## Available Hooks
- useConversation — convenience hook combining all state and methods
- useConversationControls — action methods (startSession, endSession)
- useConversationStatus — connection status
- useConversationInput — mute state
- useConversationMode — speaking/listening state
- useConversationFeedback — feedback availability and submission
- useConversationClientTool — dynamic client tool registration
- useRawConversation — raw conversation instance

## Usage Pattern
```tsx
import { ConversationProvider, useConversation } from "@elevenlabs/react-native";

// Wrap app with ConversationProvider
// Use useConversation hook in screens
// Start session with agentId
// Support clientTools, dynamicVariables, onConnect/onDisconnect/onMessage/onError callbacks
// sendUserMessage for text, sendContextualUpdate for context
// sendFeedback(true/false) for thumbs up/down
```

## Client Tools
- Can register client tools that the agent can call
- Tools run on the device (e.g., getBatteryLevel, changeBrightness)
- Perfect for language learning: show vocabulary, play audio, navigate to exercise, etc.

## For ConnectWorld AI
- Since this requires dev builds (not Expo Go), we need to build the integration
  but note it won't work in web preview
- We'll build a service layer that works on web (fallback) and native (full WebRTC)
- Agent IDs will be configured per agent type (tutor, practice partner, etc.)
