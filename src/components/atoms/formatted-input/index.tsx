import * as React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

export interface ITheme {
  height?: string;
  width?: string;
  textColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderColorError?: string;
  backgroundColor?: string;
  backgroundColorError?: string;
  textColorError?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundPosition?: string;
}

const defaultTheme = {
  height: '100%',
  width: '100%',
  textColor: '#3A3A3A',
  borderWidth: 2,
  borderColor: '#C3C3C3',
  labelColor: '#3A3A3A',
  borderColorError: '#f79f79',
  backgroundColor: 'white',
  backgroundColorError: '#f79f79',
  textColorError: 'white',
  fontSize: 21,
  fontFamily: 'Sofia Pro'
};

export interface IProps {
  id: string;
  type: string;
  checked: boolean;
  title?: string;
  value?: string;
  formattedMessageId: string;
  defaultMessage: string;
  theme?: ITheme;
  onChange?: (event: React.FormEvent<HTMLInputElement>) => void;
}

export const FormattedInput: React.FC<IProps> = (props: IProps) => {
  const {
    id,
    title,
    checked,
    type,
    value,
    theme,
    formattedMessageId,
    defaultMessage,
    onChange
  } = props;
  const expandedTheme = { ...defaultTheme, ...theme };
  console.log(id,
    title,
    checked,
    type,
    value,
    expandedTheme,
    formattedMessageId,
    defaultMessage)
  return (
    <label>
      <FormattedMessage id={formattedMessageId} defaultMessage={defaultMessage}>
        <InputField
          data-selector={`${id}-input-field`}
          type={type}
          title={title}
          value={value}
          checked={checked}
          theme={expandedTheme}
          onChange={onChange}
        />
      </FormattedMessage>
    </label>
  );
};

const InputField = styled.input`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  color: ${props => props.theme.textColor || '#3A3A3A'};
  height: ${props =>
    props.theme.height ? `${props.theme.height}%` : 'fill-available'};
  width: ${props =>
    props.theme.width ? `${props.theme.width}%` : 'fill-available'};
  border: ${props =>
    props.theme.borderWidth ? `${props.theme.borderWidth}px solid;` : 0};
  background-color: ${props => props.theme.backgroundColor || 'transparent'};
  font-size: ${props => `${(props.theme.fontSize || 21) - 2}px`};
  padding-left: 10px;
  background: url('./select_icons.png') no-repeat;
`;

export default FormattedInput;
