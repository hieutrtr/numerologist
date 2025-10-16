# Azure Speech Services Setup Guide

Complete setup guide for Azure Speech Services (Speech-to-Text) for Vietnamese language support.

**Last Updated:** January 16, 2025

## Overview

Numeroly uses **Azure Speech Services** (Cognitive Services) for Vietnamese speech-to-text transcription. The service is configured in the `southeastasia` region to provide optimal latency and language support for Vietnamese users.

## Prerequisites

- Azure Subscription (free tier: 5 audio hours/month)
- Azure portal access
- .env file in project root

## Step 1: Create Azure Subscription

If you don't have an Azure subscription:

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign up for a free account or use existing account
3. Free tier includes 5 hours of speech recognition per month

## Step 2: Create Speech Services Resource

1. **Open Azure Portal:** https://portal.azure.com
2. **Search for "Speech Services"** in the search bar
3. **Click "+ Create" button**
4. **Fill in Resource Details:**
   - **Resource Group:** Create new or select existing
     - Example: `numeroly-dev` or `numeroly-prod`
   - **Region:** `Southeast Asia` (southeastasia)
     - **WHY:** Optimized data residency for Vietnamese users, lower latency
   - **Name:** `numeroly-speech` or similar
   - **Pricing Tier:** `Standard S0` (recommended for production)
     - Free tier available for testing: limited to 5 hours/month
5. **Click "Review + Create"**
6. **Click "Create"**
7. **Wait for deployment** (usually 1-2 minutes)

## Step 3: Get Credentials

After resource is created:

1. **Go to Resource** (Azure will show button after creation)
2. **In left sidebar, find "Keys and Endpoint"**
3. **Copy the following:**
   - **Key 1** (primary key)
   - **Endpoint** (should start with `https://southeastasia.tts.speech.microsoft.com/`)

4. **Save to .env file:**
   ```bash
   AZURE_SPEECH_KEY=your_key_1_here
   AZURE_SPEECH_REGION=southeastasia
   ```

## Step 4: Configure Speech Services

In Azure portal for your Speech Services resource:

1. **Go to "Custom Neural Voice"** (if available for your region)
2. **Verify Language:** Vietnamese (vi-VN)
3. **Recognition Mode:** Set to "Conversation" (for natural speech)
4. **Profanity Filter:** Disabled (user-generated content)

## Step 5: Enable WebSocket Streaming

Azure Speech Services automatically supports WebSocket streaming for real-time transcription.

**WebSocket Endpoint Format:**
```
wss://<region>.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=vi-VN
```

**Example:**
```
wss://southeastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=vi-VN
```

**Authentication Header:**
```
Ocp-Apim-Subscription-Key: <your_azure_speech_key>
```

## Step 6: Test Configuration

### Backend Test (Python)

```python
import os
import asyncio
from azure.cognitiveservices.speech import SpeechConfig, SpeechRecognizer

# Load from .env
subscription_key = os.getenv("AZURE_SPEECH_KEY")
region = os.getenv("AZURE_SPEECH_REGION")

# Create config
speech_config = SpeechConfig(subscription=subscription_key, region=region)
speech_config.speech_recognition_language = "vi-VN"

# Test with default microphone
recognizer = SpeechRecognizer(speech_config=speech_config)

print("Say something...")
result = recognizer.recognize_once()

if result.reason:
    print(f"Transcribed: {result.text}")
else:
    print(f"Error: {result.error_details}")
```

### Frontend Test (React Native)

```typescript
import { useAzureSpeechToText } from '../services/speech-to-text';

export const TestComponent = () => {
  const { startRecording, stopRecording } = useAzureSpeechToText();
  
  return (
    <View>
      <Button title="Start Recording" onPress={startRecording} />
      <Button title="Stop Recording" onPress={stopRecording} />
    </View>
  );
};
```

## Environment Variables

Add these to `.env` file in project root:

```env
# Azure Speech Services Configuration
AZURE_SPEECH_KEY=your_subscription_key_here
AZURE_SPEECH_REGION=southeastasia
```

Also add to `.env.example` for documentation:

```env
# Azure Speech Services Configuration
# Get from: https://portal.azure.com → Speech Services resource → Keys and Endpoint
AZURE_SPEECH_KEY=your_subscription_key_here
AZURE_SPEECH_REGION=southeastasia
```

## Pricing

### Azure Speech Services Pricing (as of January 2025)

| Tier | Cost | Limits |
|------|------|--------|
| Free | $0 | 5 hours/month |
| Standard | ~$1.50/hour | Pay-as-you-go |

**For MVP Testing:** Free tier (5 hours) is sufficient for initial testing with multiple users.

**For Production:** Use Standard tier with ~100-200 hours/month budget for prototype user testing.

## Troubleshooting

### Issue: Authentication Error (401)

**Cause:** Invalid subscription key or region mismatch

**Fix:**
1. Verify `AZURE_SPEECH_KEY` is correct (Key 1 or Key 2)
2. Verify `AZURE_SPEECH_REGION` matches resource region
3. Check key hasn't expired (keys don't expire, but check in portal)

### Issue: No Recognition Results

**Cause:** Audio not being received or language not set correctly

**Fix:**
1. Verify audio input is working (check microphone permissions)
2. Verify language is set to `vi-VN`
3. Check audio format is 16kHz PCM mono

### Issue: Timeout Errors

**Cause:** Network issues or Azure service unavailable

**Fix:**
1. Check network connection
2. Verify Azure region is `southeastasia`
3. Check Azure status: https://status.azure.com

### Issue: Low Accuracy for Vietnamese

**Cause:** Background noise or regional dialect

**Fix:**
1. Test in quiet environment first
2. Verify speaker is using standard Vietnamese (not heavy regional dialect)
3. Adjust confidence threshold if needed

## Testing with Real Vietnamese Audio

### Test Phrases (Standard Vietnamese)

1. **"Xin chào"** (Hello)
2. **"Ngày hôm nay là mười sáu tháng một"** (Today is January 16)
3. **"Tôi tên là Việt Nam"** (My name is Vietnam)
4. **"Số điện thoại của tôi là một hai ba bốn năm sáu bảy tám chín không"** (My phone number is 1234567890)

### Test Scenarios

- [ ] Quiet environment, standard speech
- [ ] Moderate background noise (café level)
- [ ] Fast speech
- [ ] Slow speech
- [ ] Different Vietnamese regional accents
- [ ] Numbers and dates
- [ ] Common phrases and greetings

## Regional Considerations

### Southeast Asia Region (`southeastasia`)

**Advantages:**
- Lowest latency for Vietnamese users
- Data residency compliant with regional regulations
- Support for Vietnamese language model
- Optimal for speech recognition accuracy

**Endpoint:** `southeastasia.tts.speech.microsoft.com`

## References

- [Azure Speech Services Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [Supported Languages](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support)
- [WebSocket Endpoint Reference](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/websocket-endpoint)
- [Python SDK Guide](https://docs.microsoft.com/en-us/python/api/azure-cognitiveservices-speech/)

## Support

For issues:

1. Check [Azure Status Page](https://status.azure.com)
2. Review [Azure Speech Services FAQ](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/faq-stt)
3. File issue in GitHub with logs from Sentry

---

**Last Updated:** January 16, 2025
**Status:** Complete ✓
