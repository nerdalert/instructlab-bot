// src/components/Chat/index.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import ArrowUpIcon from '@patternfly/react-icons/dist/dynamic/icons/arrow-up-icon';
import Image from 'next/image';
import { callChatModel, Message } from '../../app/actions';
import { readStreamableValue } from 'ai/rsc';
import styles from './chat.module.css';

export const ChatForm: React.FunctionComponent = () => {
  const [question, setQuestion] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    const newMessages: Message[] = [{ role: 'user', content: question }];
    setMessages(newMessages);
    setIsLoading(true);
    setQuestion('');
    setStreamedContent('');

    const result = await callChatModel(newMessages);

    let assistantMessage = '';
    for await (const chunk of readStreamableValue(result)) {
      assistantMessage += chunk;
      setStreamedContent(assistantMessage);
      setMessages([
        { role: 'user', content: question },
        { role: 'assistant', content: assistantMessage },
      ]);
    }

    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamedContent]);

  return (
    <div className={styles.chatContainer}>
      <h1 className={styles.chatTitle}>
        Model Chat - <em>Experimental</em>
      </h1>
      <div ref={messagesContainerRef} className={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${msg.role === 'user' ? styles.chatQuestion : styles.chatAnswer}`}>
            {msg.role === 'user' ? (
              <UserIcon className={styles.userIcon} />
            ) : (
              <Image src="/bot-icon-chat-32x32.svg" alt="Bot" className={styles.botIcon} width={32} height={32} />
            )}
            <pre>
              <code>{msg.content}</code>
            </pre>
            {msg.role !== 'user' && (
              <Button variant="plain" onClick={() => copyToClipboard(msg.content)} aria-label="Copy to clipboard">
                <CopyIcon />
              </Button>
            )}
          </div>
        ))}
        {streamedContent && (
          <div className={styles.message}>
            <Image src="/bot-icon-chat-32x32.svg" alt="Bot" className={styles.botIcon} width={32} height={32} />
            <pre>
              <code>{streamedContent}</code>
            </pre>
          </div>
        )}
        {isLoading && <Spinner className={styles.spinner} aria-label="Loading" size="lg" />}
      </div>
      <div className={styles.chatFormContainer}>
        <Form onSubmit={handleSubmit} className={styles.chatForm}>
          <div className={styles.inputFieldsContainer}>
            <div className={styles.inputFields}>
              <FormGroup fieldId="question-field" className={styles.inputField}>
                <TextInput
                  isRequired
                  type="text"
                  id="question-field"
                  name="question-field"
                  value={question}
                  onChange={(_, value) => handleQuestionChange(value)}
                  placeholder="Type your question here..."
                />
              </FormGroup>
            </div>
            <Button type="submit" className={styles.sendButton} aria-label="Send">
              <ArrowUpIcon />
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
