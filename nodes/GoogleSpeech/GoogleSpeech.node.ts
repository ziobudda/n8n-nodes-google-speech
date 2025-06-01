import {
	NodeOperationError,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { writeFileSync } from 'fs';
import { join } from 'path';

export class GoogleSpeech implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Speech',
		name: 'googleSpeech',
		icon: 'file:googleSpeech.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Use Google Speech API',
		defaults: {
			name: 'Google Speech',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googleSpeechApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Speech to Text',
						value: 'speechToText',
					},
					{
						name: 'Text to Speech',
						value: 'textToSpeech',
					},
				],
				default: 'speechToText',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
					},
				},
				options: [
					{
						name: 'Recognize',
						value: 'recognize',
						description: 'Convert speech to text',
						action: 'Recognize speech to text',
					},
				],
				default: 'recognize',
			},
			// Parameters for the recognize operation
			{
				displayName: 'Language Code',
				name: 'languageCode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
					},
				},
				options: [
					{
						name: 'Italian (it-IT)',
						value: 'it-IT',
					},
					{
						name: 'English US (en-US)',
						value: 'en-US',
					},
					{
						name: 'English UK (en-GB)',
						value: 'en-GB',
					},
					{
						name: 'French (fr-FR)',
						value: 'fr-FR',
					},
					{
						name: 'German (de-DE)',
						value: 'de-DE',
					},
					{
						name: 'Polish (pl-PL)',
						value: 'pl-PL',
					},
					{
						name: 'Spanish (es-ES)',
						value: 'es-ES',
					},
				],
				default: 'it-IT',
				description: 'The language of the supplied audio',
				required: true,
			},
			{
				displayName: 'Upload Method',
				name: 'uploadMethod',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
					},
				},
				options: [
					{
						name: 'Base64 Content',
						value: 'base64',
					},
					{
						name: 'URI (Remote Audio File)',
						value: 'uri',
					},
				],
				default: 'base64',
				description: 'How to upload the audio content',
			},
			{
				displayName: 'IMPORTANTE: Best Practice',
				name: 'bestPractice',
				type: 'notice',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
						uploadMethod: [
							'base64',
						],
					},
				},
				default: 'Se stai usando il formato OGG_OPUS, prova queste frequenze: 8000 Hz, 16000 Hz, 24000 Hz, 48000 Hz. Se non funziona, prova a convertire il file in FLAC o LINEAR16(WAV) a 16000 Hz.',
			},
			{
				displayName: 'Audio Content (Base64)',
				name: 'audioContent',
				type: 'string',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
						uploadMethod: [
							'base64',
						],
					},
				},
				default: '',
				description: 'Base64-encoded audio content',
				typeOptions: {
					rows: 4,
				},
				required: true,
			},
			{
				displayName: 'Audio URI',
				name: 'audioUri',
				type: 'string',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
						uploadMethod: [
							'uri',
						],
					},
				},
				default: '',
				description: 'URI of the audio file in Cloud Storage (gs://...) or publicly accessible URL',
				placeholder: 'gs://bucket/audio.flac or https://example.com/audio.wav',
				required: true,
			},
			{
				displayName: 'Audio Format',
				name: 'audioFormat',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
						uploadMethod: [
							'base64',
						],
					},
				},
				options: [
					{
						name: 'OGG Opus',
						value: 'OGG_OPUS',
					},
					{
						name: 'FLAC (Consigliato per nuovi file)',
						value: 'FLAC',
					},
					{
						name: 'LINEAR16 - WAV (Consigliato per nuovi file)',
						value: 'LINEAR16',
					},
					{
						name: 'MP3',
						value: 'MP3',
					},
					{
						name: 'Auto-detect (Non consigliato)',
						value: 'AUTO',
					},
				],
				default: 'OGG_OPUS',
				description: 'Il formato dell\'audio - preferire formati senza perdita (FLAC, LINEAR16)',
				required: true,
			},
			{
				displayName: 'Sample Rate (Hz)',
				name: 'sampleRateHertz',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
						uploadMethod: [
							'base64',
						],
						audioFormat: [
							'LINEAR16',
							'FLAC',
							'OGG_OPUS',
							'MP3',
						],
					},
				},
				options: [
					{
						name: '8000 Hz (qualità telefonica)',
						value: 8000,
					},
					{
						name: '16000 Hz (consigliato per voce)',
						value: 16000,
					},
					{
						name: '22050 Hz',
						value: 22050,
					},
					{
						name: '24000 Hz (alta qualità voce)',
						value: 24000,
					},
					{
						name: '44100 Hz (qualità CD)',
						value: 44100,
					},
					{
						name: '48000 Hz (alta fedeltà)',
						value: 48000,
					},
				],
				default: 48000,
				description: 'Frequenza di campionamento in Hertz - Per OGG_OPUS prova diverse frequenze',
				required: true,
			},
			{
				displayName: 'Modello di Riconoscimento',
				name: 'model',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'speechToText',
						],
						operation: [
							'recognize',
						],
					},
				},
				options: [
					{
						name: 'Default (uso generale)',
						value: 'default',
					},
					{
						name: 'Latest Short (comandi brevi)',
						value: 'latest_short',
					},
					{
						name: 'Telefonico (per audio a bassa qualità)',
						value: 'phone_call',
					},
					{
						name: 'Video',
						value: 'video',
					},
				],
				default: 'default',
				description: 'Modello di machine learning da utilizzare',
			},
			// Text-to-Speech parameters
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
					},
				},
				options: [
					{
						name: 'Synthesize',
						value: 'synthesize',
						description: 'Convert text to speech',
						action: 'Synthesize text to speech',
					},
				],
				default: 'synthesize',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				default: '',
				description: 'Il testo da convertire in voce',
				typeOptions: {
					rows: 4,
				},
				required: true,
			},
			{
				displayName: 'Output Format',
				name: 'audioEncoding',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				options: [
					{
						name: 'MP3',
						value: 'MP3',
					},
					{
						name: 'LINEAR16 (WAV)',
						value: 'LINEAR16',
					},
					{
						name: 'OGG Opus',
						value: 'OGG_OPUS',
					},
				],
				default: 'MP3',
				description: 'Il formato del file audio generato',
				required: true,
			},
			{
				displayName: 'Language',
				name: 'languageCode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				options: [
					{
						name: 'Italian (it-IT)',
						value: 'it-IT',
					},
					{
						name: 'English US (en-US)',
						value: 'en-US',
					},
					{
						name: 'English UK (en-GB)',
						value: 'en-GB',
					},
					{
						name: 'French (fr-FR)',
						value: 'fr-FR',
					},
					{
						name: 'German (de-DE)',
						value: 'de-DE',
					},
					{
						name: 'Polish (pl-PL)',
						value: 'pl-PL',
					},
					{
						name: 'Spanish (es-ES)',
						value: 'es-ES',
					},
				],
				default: 'it-IT',
				description: 'La lingua del testo',
				required: true,
			},
			{
				displayName: 'Voice Type',
				name: 'voiceType',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				options: [
					{
						name: 'Standard (economico)',
						value: 'Standard',
					},
					{
						name: 'WaveNet (alta qualità)',
						value: 'Wavenet',
					},
					{
						name: 'Neural2 (migliore qualità)',
						value: 'Neural2',
					},
				],
				default: 'Standard',
				description: 'Il tipo di voce da utilizzare',
			},
			{
				displayName: 'Specific Voice',
				name: 'specificVoice',
				type: 'options',
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				options: [
					{
						name: 'Voice A (Female)',
						value: 'A',
					},
					{
						name: 'Voice B (Female)',
						value: 'B',
					},
					{
						name: 'Voice C (Female)',
						value: 'C',
					},
					{
						name: 'Voice D (Female)',
						value: 'D',
					},
					{
						name: 'Voice E (Male)',
						value: 'E',
					},
					{
						name: 'Voice F (Male)',
						value: 'F',
					},
				],
				default: 'A',
				description: 'Voce specifica da utilizzare',
			},
			{
				displayName: 'Speaking Rate',
				name: 'speakingRate',
				type: 'number',
				typeOptions: {
					minValue: 0.25,
					maxValue: 4.0,
					numberPrecision: 2,
				},
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				default: 1.0,
				description: 'Velocità di parlato (0.25-4.0, 1.0 è normale)',
			},
			{
				displayName: 'Pitch',
				name: 'pitch',
				type: 'number',
				typeOptions: {
					minValue: -20.0,
					maxValue: 20.0,
					numberPrecision: 1,
				},
				displayOptions: {
					show: {
						resource: [
							'textToSpeech',
						],
						operation: [
							'synthesize',
						],
					},
				},
				default: 0.0,
				description: 'Tono della voce (-20.0 a 20.0, 0.0 è normale)',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Enable Automatic Punctuation',
						name: 'enableAutomaticPunctuation',
						type: 'boolean',
						default: true,
						description: 'Aggiunge punteggiatura automatica al risultato',
					},
					{
						displayName: 'Number of Channels',
						name: 'audioChannelCount',
						type: 'number',
						default: 1,
						description: 'Numero di canali audio (1=mono, 2=stereo)',
					},
					{
						displayName: 'Separate Recognition Per Channel',
						name: 'enableSeparateRecognitionPerChannel',
						type: 'boolean',
						default: false,
						description: 'Riconosce ogni canale separatamente (per audio stereo)',
					},
					{
						displayName: 'Save To Tmp Directory',
						name: 'saveToTmp',
						type: 'boolean',
						displayOptions: {
							show: {
								'/resource': [
									'textToSpeech',
								],
								'/operation': [
									'synthesize',
								],
							},
						},
						default: false,
						description: 'Salva il file audio generato nella directory /tmp',
					},
					{
						displayName: 'Filename',
						name: 'filename',
						type: 'string',
						displayOptions: {
							show: {
								'/resource': [
									'textToSpeech',
								],
								'/operation': [
									'synthesize',
								],
								saveToTmp: [
									true,
								],
							},
						},
						default: 'speech_output',
						description: 'Nome del file da salvare in /tmp (senza estensione)',
					},
					{
						displayName: 'Boost per Parole Specifiche',
						name: 'speechContexts',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						placeholder: 'Add Speech Context',
						options: [
							{
								name: 'context',
								displayName: 'Context',
								values: [
									{
										displayName: 'Parole o Frasi',
										name: 'phrases',
										type: 'string',
										typeOptions: {
											multipleValues: true,
										},
										default: [],
										description: 'Parole o frasi che potrebbero apparire nell\'audio',
									},
									{
										displayName: 'Boost',
										name: 'boost',
										type: 'number',
										default: 20,
										description: 'Quanto aumentare la probabilità di queste parole (0-20)',
									},
								],
							},
						],
						description: 'Aiuta il riconoscimento di parole o frasi specifiche',
					},
				],
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials
		const credentials = await this.getCredentials('googleSpeechApi');
		
		try {
			// Initialize the client with the credentials
			let serviceAccountKey;
			try {
				serviceAccountKey = JSON.parse(credentials.serviceAccountKey as string);
				
				if (!serviceAccountKey.client_email || !serviceAccountKey.private_key || !serviceAccountKey.project_id) {
					throw new Error('Invalid service account key: Missing required fields');
				}
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid service account key JSON. Please provide a valid service account key.', {
					description: 'The service account key must be a valid JSON object containing client_email, private_key, and project_id.',
				});
			}
			
			// Create the Speech client with the service account key
			const speechClient = new SpeechClient({
				credentials: serviceAccountKey,
			});

			if (resource === 'speechToText') {
				if (operation === 'recognize') {
					// Get parameters
					const languageCode = this.getNodeParameter('languageCode', 0) as string;
					const uploadMethod = this.getNodeParameter('uploadMethod', 0) as string;
					const model = this.getNodeParameter('model', 0) as string;
					const additionalOptions = this.getNodeParameter('additionalOptions', 0, {}) as Record<string, any>;
					
					// Basic config
					const config: Record<string, any> = {
						languageCode,
						model,
						enableAutomaticPunctuation: true, // Default behavior
					};
					
					// Add additional options if provided
					if (additionalOptions.enableAutomaticPunctuation !== undefined) {
						config.enableAutomaticPunctuation = additionalOptions.enableAutomaticPunctuation;
					}
					
					if (additionalOptions.audioChannelCount !== undefined) {
						config.audioChannelCount = additionalOptions.audioChannelCount;
					}
					
					if (additionalOptions.enableSeparateRecognitionPerChannel !== undefined) {
						config.enableSeparateRecognitionPerChannel = additionalOptions.enableSeparateRecognitionPerChannel;
					}
					
					// Add speech contexts if provided
					if (additionalOptions.speechContexts && additionalOptions.speechContexts.context) {
						const contexts = additionalOptions.speechContexts.context;
						if (Array.isArray(contexts) && contexts.length > 0) {
							config.speechContexts = contexts.map((context: {phrases: string[], boost: number}) => ({
								phrases: context.phrases,
								boost: context.boost,
							}));
						}
					}
					
					// Prepare audio source based on upload method
					let request: Record<string, any>;
					
					if (uploadMethod === 'uri') {
						// URI-based request
						const audioUri = this.getNodeParameter('audioUri', 0) as string;
						request = {
							audio: {
								uri: audioUri,
							},
							config,
						};
					} else {
						// Base64 content-based request
						let audioContent = this.getNodeParameter('audioContent', 0) as string;
						
						// Get format information for base64 content
						const audioFormat = this.getNodeParameter('audioFormat', 0) as string;
						
						// Set encoding for the request if not auto-detect
						if (audioFormat !== 'AUTO') {
							config.encoding = audioFormat;
							
							// Add sample rate if format requires it
							if (audioFormat !== 'AUTO') {
								config.sampleRateHertz = this.getNodeParameter('sampleRateHertz', 0) as number;
							}
						}
						
						// Remove any data URI or Base64 prefixes
						if (audioContent.includes('base64,')) {
							audioContent = audioContent.split('base64,')[1];
						}
						
						// Make a clean base64 string
						audioContent = audioContent.trim();
						
						request = {
							audio: {
								content: audioContent,
							},
							config,
						};
					}

					// Make the API call
					const [response] = await speechClient.recognize(request);
					
					// Process response
					const transcription = response.results
						?.map(result => result.alternatives?.[0]?.transcript)
						.filter(Boolean)
						.join('\n');

					// Return the results with confidence scores if available
					if (response.results && response.results.length > 0) {
						const detailedResults = response.results.map(result => {
							if (result.alternatives && result.alternatives.length > 0) {
								return {
									transcript: result.alternatives[0].transcript,
									confidence: result.alternatives[0].confidence,
								};
							}
							return null;
						}).filter(Boolean);
						
						returnData.push({
							json: {
								transcription,
								detailedResults,
								fullResponse: response,
								requestConfig: config, // For debugging
							},
						});
					} else {
						returnData.push({
							json: {
								transcription: '',
								message: 'No speech detected or recognized. Try with a different audio file, format, or sample rate.',
								fullResponse: response,
								requestConfig: config,
							},
						});
					}
				}
			} else if (resource === 'textToSpeech') {
				if (operation === 'synthesize') {
					// Create the Text to Speech client
					const textToSpeechClient = new TextToSpeechClient({
						credentials: serviceAccountKey,
					});
					
					// Get parameters
					const text = this.getNodeParameter('text', 0) as string;
					const audioEncoding = this.getNodeParameter('audioEncoding', 0) as string;
					const languageCode = this.getNodeParameter('languageCode', 0) as string;
					const voiceType = this.getNodeParameter('voiceType', 0) as string;
					const specificVoice = this.getNodeParameter('specificVoice', 0) as string;
					const speakingRate = this.getNodeParameter('speakingRate', 0) as number;
					const pitch = this.getNodeParameter('pitch', 0) as number;
					const additionalOptions = this.getNodeParameter('additionalOptions', 0, {}) as Record<string, any>;
					
					// Costruisci il nome della voce direttamente usando specificVoice
					const voiceName = `${languageCode}-${voiceType}-${specificVoice}`;
					
					// Create the synthesis request
					const request = {
						input: { text },
						voice: {
							languageCode,
							name: voiceName,
							ssmlGender: specificVoice === 'E' || specificVoice === 'F' ? 'MALE' : 'FEMALE',
						},
						audioConfig: {
							audioEncoding,
							speakingRate,
							pitch,
						},
					};
					
					// Perform the text-to-speech request
					const [response] = await textToSpeechClient.synthesizeSpeech(request as any);
					
					// The response's audioContent is binary
					const audioContent = response.audioContent;
					
					if (!audioContent) {
						throw new Error('Failed to synthesize speech: No audio content returned');
					}
					
					// Convert binary audio content to base64
					const audioBase64 = Buffer.from(audioContent as Buffer).toString('base64');
					
					// Determine the MIME type based on the audio encoding
					let mimeType = 'audio/mpeg'; // Default for MP3
					if (audioEncoding === 'LINEAR16') {
						mimeType = 'audio/wav';
					} else if (audioEncoding === 'OGG_OPUS') {
						mimeType = 'audio/ogg';
					}
					
					// Salva il file in /tmp se richiesto
					let filePath = '';
					if (additionalOptions.saveToTmp === true) {
						// Determina l'estensione del file in base al formato audio
						let extension = '.mp3'; // Default for MP3
						if (audioEncoding === 'LINEAR16') {
							extension = '.wav';
						} else if (audioEncoding === 'OGG_OPUS') {
							extension = '.ogg';
						}
						
						// Preparazione del filename
						const filename = additionalOptions.filename ? additionalOptions.filename : 'speech_output';
						filePath = join('/tmp', `${filename}${extension}`);
						
						try {
							// Scrittura del file su disco
							writeFileSync(filePath, audioContent);
						} catch (error) {
							throw new Error(`Errore durante il salvataggio del file in /tmp: ${(error as Error).message}`);
						}
					}
					
					// Return the audio content as both binary and base64
					returnData.push({
						json: {
							success: true,
							audioFormat: audioEncoding,
							mimeType,
							tempFilePath: filePath || undefined,
						},
						binary: {
							// For compatibility with n8n file nodes
							audio: {
								data: audioBase64,
								mimeType,
							}
						}
					});
				}
			}
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: (error as Error).message,
						stack: (error as Error).stack,
						suggestion: resource === 'speechToText' 
							? 'Per file OGG_OPUS, prova diverse frequenze (8000, 16000, 24000, o 48000 Hz). Se continua a non funzionare, considera di convertire l\'audio in FLAC o LINEAR16 (WAV).'
							: 'Verifica che il testo non sia troppo lungo e che la configurazione della voce sia corretta.'
					},
				});
			} else {
				const errorDescription = resource === 'speechToText'
					? `${(error as Error).message} - Per file OGG_OPUS, prova diverse frequenze di campionamento o considera la conversione in FLAC.`
					: `${(error as Error).message} - Verifica la configurazione della voce e la lunghezza del testo.`;
					
				throw new NodeOperationError(this.getNode(), error as Error, {
					description: errorDescription,
				});
			}
		}

		return [returnData];
	}
}
