import { useState } from 'react';
import axios from 'axios';

const useApiChat = () => {
  const [isLoading, setIsLoading] = useState(false);

  const postChat = async (question, context, isStream = false) => {
    setIsLoading(true);
    const messages = [];
    if (context) {
      // System message for context
      messages.push({ text: context, isUser: false });
    }
    // User message for the question
    messages.push({ text: question, isUser: true });

    const requestData = {
      messages: messages.map(message => ({
        content: message.text,
        role: message.isUser ? 'user' : 'system'
      })),
      stream: isStream
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (isStream) {
      let { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder('utf-8');

      try {
        const response = await fetch('http://127.0.0.1:8000/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });

        const reader = response.body?.getReader();

        if (!reader) {
          setIsLoading(false);
          return null;
        }

        (async () => {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const decodedChunk = textDecoder.decode(value, { stream: true });
            const lines = decodedChunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const json = line.replace('data: ', '');
                if (json === '[DONE]') break;

                try {
                  const parsed = JSON.parse(json);
                  const deltaContent = parsed.choices[0].delta.content;
                  if (deltaContent) {
                    writer.write(textEncoder.encode(deltaContent));
                  }
                } catch (err) {
                  console.error('Error parsing chunk:', err);
                }
              }
            }
          }
          writer.close();
          setIsLoading(false);
        })();

        return readable;
      } catch (error) {
        setIsLoading(false);
        console.error('Error streaming chat completion:', error);
        return null;
      }
    } else {
      try {
        const response = await axios.post(
          'http://127.0.0.1:8000/v1/chat/completions',
          requestData,
          { headers }
        );
        setIsLoading(false);
        return response.data;
      } catch (error) {
        setIsLoading(false);
        console.error('Error fetching chat completion:', error);
        return null;
      }
    }
  };

  return {
    isLoading,
    postChat
  };
};

export default useApiChat;
