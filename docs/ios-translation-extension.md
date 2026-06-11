# iOS Translation Extension — ConnectWorld AI

## Overview

To make ConnectWorld AI appear as a choice in iOS's "Change Default Translation App" picker
(shown when users long-press text in iMessage and tap "Translate"), you need to add a
**Translation Extension** to the native Xcode project.

## Requirements

- iOS 17.4+ (Translation Provider API)
- Xcode 15.3+
- Apple Developer Program membership

## Two Approaches

### Approach 1: Custom UI Translation (Recommended)

Uses Apple's `TranslationSession` API (iOS 18+) with **fully custom UI**.
This is what ConnectWorld AI uses — we get the raw translation and render our own
distinctive popup with color-coded word breakdown, pronunciation, and learning features.

Key advantage: **Complete design freedom** — animations, gradients, glow effects,
branded colors, word-by-word breakdown, "Learn" button, pronunciation playback.

### Approach 2: Translation Provider Extension (iOS 17.4+)

Registers ConnectWorld AI as a system-level translation provider so iOS uses it
everywhere (iMessage, Safari, etc.) instead of Google Translate.

## Implementation: Custom UI Translation

```swift
import Translation

struct MessageView: View {
    @State var configuration: TranslationSession.Configuration?
    
    var body: some View {
        Text(messageText)
            .translationTask(configuration) { session in
                let response = try await session.translate(messageText)
                // Show our custom ConnectWorld AI popup with:
                // - Animated gradient border
                // - Word-by-word color-coded breakdown
                // - Pronunciation for each word
                // - "Learn These" button to save to deck
                // - Formality/context badge
                // - Quick reply suggestion
                showConnectWorldPopup(translation: response.targetText)
            }
    }
}
```

## Implementation: Translation Provider Extension

### 1. Add App Extension Target

In Xcode: File > New > Target > "Translation Extension"

### 2. Implement TranslationProvider

```swift
@available(iOS 17.4, *)
class ConnectWorldTranslationProvider: TranslationProvider {
    func translate(_ text: String, from: Locale.Language?, to: Locale.Language) async throws -> String {
        let result = try await ConnectWorldAPI.translate(text: text, to: to.languageCode?.identifier ?? "en")
        return result.translatedText
    }
    
    func supportedLanguages() async throws -> [Locale.Language] {
        return ["en","es","fr","de","it","pt","ja","ko","zh","ar","hi","sw","ru","tr","vi","th","nl"]
            .map { Locale.Language(identifier: $0) }
    }
}
```

### 3. Info.plist

```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.translation-provider</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).ConnectWorldTranslationProvider</string>
</dict>
```

## Live Call Translation (CallKit Integration)

For real-time phone call translation:

```swift
import CallKit
import Speech

class CallTranslationManager: CXCallObserverDelegate {
    let callObserver = CXCallObserver()
    let speechRecognizer = SFSpeechRecognizer()
    
    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        if call.hasConnected && !call.hasEnded {
            startLiveTranslation()
        }
    }
    
    func startLiveTranslation() {
        // 1. Capture incoming audio stream
        // 2. Run speech-to-text
        // 3. Translate detected text
        // 4. Show floating caption overlay (PiP-style)
        // 5. Optionally speak translation via earpiece
    }
}
```

### Supported Call Types
- Regular phone calls (CallKit)
- FaceTime (AVAudioSession)
- WhatsApp/Telegram (audio routing)

### Pricing Model
- Free: 5 min/month trial
- Basic ($4.99/mo): 60 min/month
- Pro ($12.99/mo): 300 min/month + voice overlay
- Unlimited ($24.99/mo): Unlimited + conference calls

## Design Differentiation

ConnectWorld AI's translation popup is distinctive because:
1. Animated glow border (signature purple/blue)
2. Word-by-word color-coded grammar breakdown
3. Pronunciation guide for each word
4. Formality/context badge (formal/casual/slang)
5. "Learn These" button to save vocabulary
6. Smart reply suggestions in target language
7. Premium dark theme with accent glow

vs Google Translate's plain white sheet with just "Continue" button.

## Testing

1. Build with EAS: eas build --platform ios
2. Install on device
3. Settings > Translate > Default Translation App > ConnectWorld AI
4. In iMessage, long-press text > Translate > uses ConnectWorld AI
