import React, { useState, useRef, useEffect } from 'react';
import { ActionGroup, Button, Form, FormGroup, TextInput, Spinner } from '@patternfly/react-core';
import useApiChat from '@app/components/useApiChat';
import './ChatForm.css';
import { UserIcon, CopyIcon } from '@patternfly/react-icons';
import botIconSrc from '../bgimages/bot-icon-chat-32x32.svg';
import asyncRetry from 'async-retry';

interface Message {
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
}

const MAX_RETRIES = 3;

export const ChatForm: React.FunctionComponent = () => {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { isLoading, postChat } = useApiChat();
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Assume `useStreaming` is obtained from the `ChatSettings` page or defaults to `true`
  const [useStreaming] = useState(true);

  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(event.target.value);
  };

  const handleContextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContext(event.target.value);
  };

  const postChatWithRetry = async (question: string, context: string, streaming: boolean) => {
    return asyncRetry(
      async (bail) => {
        const result = await postChat(question, context, streaming);
        if (result) return result;
        throw new Error('API error');
      },
      {
        retries: MAX_RETRIES,
        onRetry: (err, attempt) => {
          console.warn(`Retry attempt ${attempt} due to ${err.message}`);
        },
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    setIsStreaming(true);

    const newMessages = [
      context.trim() ? { text: context.trim(), isUser: false } : null, // Display context as system message
      { text: question.trim(), isUser: true } // User question
    ].filter(Boolean) as Message[];

    setMessages(messages => [...messages, ...newMessages]);
    setQuestion('');

    if (useStreaming) {
      const newMessage: Message = { text: '', isUser: false, isStreaming: true };
      setMessages(messages => [...messages, newMessage]);

      let assistantReply = '';
      try {
        const stream = await postChatWithRetry(question.trim(), context.trim(), true);

        if (stream) {
          const reader = stream.getReader();
          const decoder = new TextDecoder();

          await (async () => {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              assistantReply += chunk;

              setMessages(messages => {
                const updatedMessages = [...messages];
                const lastMessageIndex = updatedMessages.length - 1;
                if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].isStreaming) {
                  updatedMessages[lastMessageIndex] = { ...updatedMessages[lastMessageIndex], text: assistantReply };
                }
                return updatedMessages;
              });
            }

            setMessages(messages => {
              const updatedMessages = [...messages];
              const lastMessageIndex = updatedMessages.length - 1;
              if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].isStreaming) {
                updatedMessages[lastMessageIndex] = { ...updatedMessages[lastMessageIndex], isStreaming: false };
              }
              return updatedMessages;
            });
          })();
        } else {
          throw new Error('Stream is unavailable');
        }
      } catch (err) {
        console.error('Failed to fetch streaming response:', err);
        setMessages(messages => [
          ...messages,
          { text: 'Failed to fetch streaming response.', isUser: false }
        ]);
      }
    } else {
      try {
        const result = await postChatWithRetry(question.trim(), context.trim(), false);
        if (result && result.choices && result.choices.length > 0) {
          setMessages(messages => [
            ...messages,
            { text: result.choices[0].message.content, isUser: false }
          ]);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (err) {
        console.error('Failed to fetch response:', err);
        setMessages(messages => [
          ...messages,
          { text: 'Failed to fetch response from the server.', isUser: false }
        ]);
      }
    }

    setIsStreaming(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => console.log('Text copied to clipboard'))
      .catch(err => console.error('Failed to copy text:', err));
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-container">
      <h1 className="chat-title">Model Chat</h1>
      <div ref={messagesContainerRef} className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'chat-question' : 'chat-answer'}`}>
            {msg.isUser ? (
              <UserIcon className="user-icon" />
            ) : (
              <img src={botIconSrc} alt="Bot" className="bot-icon" />
            )}
            <pre><code>{msg.text}</code></pre>
            {!msg.isUser && !msg.isStreaming && (
              <Button variant="plain" onClick={() => copyToClipboard(msg.text)} aria-label="Copy to clipboard">
                <CopyIcon />
              </Button>
            )}
          </div>
        ))}
        {isLoading && <Spinner aria-label="Loading" size="lg" />}
      </div>
      <Form onSubmit={handleSubmit} className="chat-form">
        <FormGroup fieldId="question-field">
          <TextInput
            isRequired
            type="text"
            id="question-field"
            name="question-field"
            value={question}
            onChange={handleQuestionChange}
            placeholder="Type your question here..."
            isDisabled={isStreaming}
          />
        </FormGroup>
        <FormGroup fieldId="context-field">
          <TextInput
            type="text"
            id="context-field"
            name="context-field"
            value={context}
            onChange={handleContextChange}
            placeholder="Optional context here..."
            isDisabled={isStreaming}
          />
        </FormGroup>
        <ActionGroup>
          <Button variant="primary" type="submit" isAriaDisabled={isStreaming}>Send</Button>
        </ActionGroup>
      </Form>
    </div>
  );
};

export default ChatForm;
