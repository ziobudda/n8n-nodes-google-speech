# n8n-nodes-google-speech

This is an n8n community node for Google Speech API integration. It provides functionality to convert audio to text using Google's Speech-to-Text API.

## Installation

Follow these instructions to install this node:

### In official n8n version

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-google-speech` in **Enter npm package name**
4. Click **Install**

### In Docker or own setup

1. Install npm package:
```bash
npm install n8n-nodes-google-speech
```
2. Add node to N8N_CUSTOM_EXTENSIONS:
```bash
export N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-google-speech"
```

## Prerequisites

To use this node, you need:

1. A Google Cloud account with the Speech-to-Text API enabled
2. A service account with access to the Speech API
3. A JSON key file for the service account

### Setting up Google Cloud credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Speech-to-Text API in the API Library
4. Go to "IAM & Admin" > "Service Accounts"
5. Create a new service account or use an existing one
6. Give it the "Cloud Speech Client" role
7. Create a new JSON key (Actions > Manage keys > Add key > Create new key)
8. Download the JSON key file
9. Paste the entire contents of the JSON file into the n8n credentials field

## Usage

1. Add a "Google Speech" node to your workflow
2. Select the "Speech to Text" resource and "Recognize" operation
3. Configure the credentials using your Service Account Key JSON
4. Provide audio as a base64-encoded string (without any prefix like "data:audio/...")
5. Set the language code (e.g. 'en-US', 'it-IT', 'fr-FR', etc.)
6. Run the workflow to convert speech to text

### Important Notes About Audio Format:
1. The audio must be properly encoded in base64 format
2. The audio should be in a supported format (e.g., WAV, MP3, FLAC)
3. Google Speech API will attempt to auto-detect the audio format
4. For best results, use audio with clear speech and minimal background noise
5. Ensure your service account has the proper permissions for the Speech API

## Resources

* [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
* [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](https://github.com/ziobuddalabs/n8n-google-speech/blob/master/LICENSE.md)