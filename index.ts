import { GoogleSpeech } from './nodes/GoogleSpeech/GoogleSpeech.node';
import { GoogleSpeechApi } from './credentials/GoogleSpeechApi.credentials';

export class GoogleSpeechNode {
	static nodeClass = GoogleSpeech;
}

export class GoogleSpeechCredentials {
	static credentialClass = GoogleSpeechApi;
}

// Export nodes and credentials in the way n8n expects it
export const nodeTypes = {
	GoogleSpeech: GoogleSpeechNode,
};

export const credentialTypes = {
	GoogleSpeechApi: GoogleSpeechCredentials,
};