import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GoogleSpeechApi implements ICredentialType {
	name = 'googleSpeechApi';
	displayName = 'Google Speech API';
	documentationUrl = 'https://cloud.google.com/speech-to-text/docs/quickstart-client-libraries';
	properties: INodeProperties[] = [
		{
			displayName: 'Service Account Key',
			name: 'serviceAccountKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Full Google Cloud service account key in JSON format. Create a service account and download the JSON file from GCP Console > IAM & Admin > Service Accounts.',
			required: true,
			hint: 'Paste the entire contents of your service account JSON key file here',
		},
	];
}