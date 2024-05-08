import React, { useState } from 'react';
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  Checkbox,
  NumberInput,
  Select,
  SelectList,
  SelectOption,
  MenuToggle
} from '@patternfly/react-core';
import { AngleDownIcon as DownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import '@app/ILSettings/ILSettings.css'

export const ChatSettings: React.FunctionComponent = () => {
  const [maxTokens, setMaxTokens] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);
  const [presencePenalty, setPresencePenalty] = useState<number>(0);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number>(0);
  const [model, setModel] = useState<string>('gpt-3.5-turbo');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isModelOpen, setIsModelOpen] = useState(false);

  const handleMaxTokensChange = (value: number) => setMaxTokens(value || null);
  const handleTemperatureChange = (value: number) => setTemperature(value);
  const handleTopPChange = (value: number) => setTopP(value);
  const handlePresencePenaltyChange = (value: number) => setPresencePenalty(value);
  const handleFrequencyPenaltyChange = (value: number) => setFrequencyPenalty(value);
  const handleModelSelect = (_event, value: string) => {
    setModel(value);
    setIsModelOpen(false);
  };
  const handleStreamingChange = (checked: boolean) => setIsStreaming(checked);

  const toggleModel = (
    <MenuToggle onClick={() => setIsModelOpen(!isModelOpen)} isExpanded={isModelOpen}>
      {model}
      <DownIcon />
    </MenuToggle>
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const settings = {
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      stream: isStreaming,
      model
    };
    console.log('Chat Settings:', settings);
    // You can replace this with API call or state persistence logic
  };

  return (
    <Form onSubmit={handleSubmit} className="chat-settings-form">
      <h1 className="settings-title"><b>Chat Settings</b></h1>
      <FormGroup label="Max Tokens" fieldId="max-tokens-field">
        <NumberInput
          value={maxTokens ?? ''}
          onMinus={() => handleMaxTokensChange((maxTokens || 0) - 1)}
          onPlus={() => handleMaxTokensChange((maxTokens || 0) + 1)}
          onChange={(event) => handleMaxTokensChange(parseInt(event.target.value))}
          min={0}
          inputName="max-tokens-field"
        />
      </FormGroup>
      <FormGroup label="Temperature" fieldId="temperature-field">
        <NumberInput
          value={temperature}
          onMinus={() => handleTemperatureChange(Math.max(0, temperature - 0.1))}
          onPlus={() => handleTemperatureChange(Math.min(2, temperature + 0.1))}
          onChange={(event) => handleTemperatureChange(parseFloat(event.target.value))}
          step={0.1}
          min={0}
          max={2}
          inputName="temperature-field"
        />
      </FormGroup>
      <FormGroup label="Top P" fieldId="top-p-field">
        <NumberInput
          value={topP}
          onMinus={() => handleTopPChange(Math.max(0, topP - 0.1))}
          onPlus={() => handleTopPChange(Math.min(1, topP + 0.1))}
          onChange={(event) => handleTopPChange(parseFloat(event.target.value))}
          step={0.1}
          min={0}
          max={1}
          inputName="top-p-field"
        />
      </FormGroup>
      <FormGroup label="Presence Penalty" fieldId="presence-penalty-field">
        <NumberInput
          value={presencePenalty}
          onMinus={() => handlePresencePenaltyChange(Math.max(0, presencePenalty - 0.1))}
          onPlus={() => handlePresencePenaltyChange(presencePenalty + 0.1)}
          onChange={(event) => handlePresencePenaltyChange(parseFloat(event.target.value))}
          step={0.1}
          min={0}
          inputName="presence-penalty-field"
        />
      </FormGroup>
      <FormGroup label="Frequency Penalty" fieldId="frequency-penalty-field">
        <NumberInput
          value={frequencyPenalty}
          onMinus={() => handleFrequencyPenaltyChange(Math.max(0, frequencyPenalty - 0.1))}
          onPlus={() => handleFrequencyPenaltyChange(frequencyPenalty + 0.1)}
          onChange={(event) => handleFrequencyPenaltyChange(parseFloat(event.target.value))}
          step={0.1}
          min={0}
          inputName="frequency-penalty-field"
        />
      </FormGroup>
      <FormGroup label="Model" fieldId="model-field">
        <Select
          id="model-select"
          isOpen={isModelOpen}
          selected={model}
          onSelect={handleModelSelect}
          onOpenChange={setIsModelOpen}
          toggle={toggleModel}
        >
          <SelectList>
            <SelectOption value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectOption>
            <SelectOption value="gpt-4">GPT-4</SelectOption>
          </SelectList>
        </Select>
      </FormGroup>
      <FormGroup label="Use Streaming" fieldId="streaming-field">
        <Checkbox
          label="Enable Streaming"
          isChecked={isStreaming}
          onChange={handleStreamingChange}
          id="streaming-field"
          name="streaming-field"
        />
      </FormGroup>
      <ActionGroup>
        <Button variant="primary" type="submit">Save Settings</Button>
      </ActionGroup>
    </Form>
  );
};

export default ChatSettings;
