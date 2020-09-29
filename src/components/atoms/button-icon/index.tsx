import * as React from 'react';
import styled from 'styled-components';

export interface ITheme {
  height?: string;
  width?: string;
  backgroundSize?: string;
}

const defaultTheme = {
  height: '28px',
  width: '28px',
  backgroundSize: '20px'
};

export interface IProps {
  id: string;
  src: string;
  theme?: ITheme;
  title?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export const ButtonIcon: React.FC<IProps> = (props: IProps) => {
  const expandedTheme = { ...defaultTheme, ...props.theme };
  return (
    <ImageButton
      id={props.id}
      src={props.src}
      theme={expandedTheme}
      title={props.title}
      alt={'button-image'}
      onClick={props.onClick}
    />
  );
};

const ImageButton = styled.img<IProps>`
  padding: 4px;
  float: left;
  opacity: 0.7;
  transition: All 0.3s;
  display: inline-block;
  height: ${props => props.theme.height};
  width: ${props => props.theme.width};
  background-size: ${props => props.theme.backgroundSize};

  &:hover {
    opacity: 1;
  }

  &:active,
  &:focus {
    outline: none;
  }
`;

export default React.memo(ButtonIcon);
