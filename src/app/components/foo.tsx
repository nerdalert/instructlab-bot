import axios from 'axios';

async function run() {
  const agentData = {
    systemPrompt: 'You are a helpful assistant.',
    prompt: 'Tell me a very short story',
  };

  const response = await axios.post("http://127.0.0.1:8000/v1/chat/completions", {
    messages: [
      { role: "system", content: agentData.systemPrompt },
      { role: "user", content: agentData.prompt }
    ],
    stream: true
  }, {
    headers: { "Content-Type": "application/json" },
    responseType: 'stream'
  });

  // Handling the stream directly
  response.data.on('data', (chunk) => {
    const textPayload = chunk.toString();
    console.log(textPayload); // Print each chunk as it is received
  });

  response.data.on('end', () => {
    console.log('Stream ended');
  });
}

run().catch(console.error);
