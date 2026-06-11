# ElevenLabs Agents Research Summary

## What is ElevenAgents?
- Voice-rich, expressive AI agents that accomplish tasks through natural dialogue
- 4 core components: ASR (speech-to-text), LLM (your choice), TTS (5000+ voices, 70+ languages), Turn-taking model
- Supports React Native via `@elevenlabs/react-native` SDK (built on LiveKit WebRTC)
- Requires Expo development builds (NOT Expo Go)

## SDK: @elevenlabs/react-native
- Install: `npm install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc livekit-client`
- Expo plugins needed: `@livekit/react-native-expo-plugin`, `@config-plugins/react-native-webrtc`
- Wrap app with `ConversationProvider`
- Hooks: useConversation, useConversationControls, useConversationStatus, useConversationInput, useConversationMode, useConversationFeedback, useConversationClientTool
- Start session with `agentId` — each agent is a separate config on ElevenLabs dashboard
- Supports: dynamic variables, overrides (prompt, voice, language per session), client tools, text input, contextual updates

## Agent Configuration Capabilities
- **Voice & Language**: 5000+ voices, 70+ languages, multi-voice for multi-character, pronunciation control (IPA/CMU), speed 0.7x-1.2x, emotional delivery with v3
- **Knowledge Base**: Upload PDFs, TXT, DOCX, URLs, text — agent uses RAG for grounded responses (20MB/300k chars limit, enterprise higher)
- **Tools**: Client-side tools (run in app), server-side tools (API calls), MCP servers, built-in platform tools
- **Personalization**: Dynamic variables ({{var_name}} in prompts), full overrides (system prompt, first message, language, voice per session)
- **Authentication**: Signed URLs (recommended, 15min expiry, server generates) or domain allowlists
- **Conversation Flow**: Turn timeout (1-30s), soft timeout (filler phrases), interruptions (enable/disable), turn eagerness (eager/normal/patient)
- **LLM Models**: GPT-5/4.1/4o, Claude Sonnet 4.5/4, Gemini 3/2.5, ElevenLabs own models, custom LLM support
- **Analysis**: Success evaluation criteria, data collection from transcripts, smart search across conversations
- **Post-call Webhooks**: Send evaluation results and extracted data to external systems

## Key Architecture Points
- Agents are created/managed via dashboard, API, or CLI
- Each agent has: system prompt, first message, voice, language, knowledge base, tools, analysis criteria
- Sessions are started client-side with agentId + optional overrides/dynamic variables
- Real-time WebSocket connection (via LiveKit WebRTC for mobile)
- Events: onConnect, onDisconnect, onMessage, onError, onModeChange (speaking/listening), onStatusChange
- Client tools: functions that run in the app, called by the agent during conversation
- Feedback: thumbs up/down per response
- Text input: sendUserMessage() for typed messages alongside voice

## Pricing Considerations
- LLM costs per million tokens (varies by model)
- TTS costs per character
- ASR costs per minute
- Burst pricing available for scaling
