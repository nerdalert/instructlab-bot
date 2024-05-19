'use server';

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';
import https from 'https';
import fs from 'fs';
import path from 'path';
import '../../envConfig';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Read certificate and key paths from environment variables
const caCertPath = process.env.CA_CERT_PATH;
const clientCertPath = process.env.CLIENT_CERT_PATH;
const clientKeyPath = process.env.CLIENT_KEY_PATH;

// Create a local OpenAI provider instance with custom HTTPS agent for the custom model
const localOpenAI = createOpenAI({
  baseURL: 'http://127.0.0.1:8000/v1',
  // baseURL: 'https://merlinite-7b-vllm-openai.apps.fmaas-backend.fmaas.res.ibm.com/chat/completions',
  httpsAgent: new https.Agent({
    ca: fs.readFileSync(caCertPath),
    cert: fs.readFileSync(clientCertPath),
    key: fs.readFileSync(clientKeyPath),
    rejectUnauthorized: false,
  }),
});

export async function callChatModel(messages: Message[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = await streamText({
      model: localOpenAI.chat('models/merlinite-7b-lab-Q4_K_M.gguf'),
      system: "You are a dude that doesn't drop character until the DVD commentary.",
      messages,
      stream: true,
    });

    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
  })();

  return stream.value;
}
