import * as React from 'react';
import styled from 'styled-components';

export interface IProps {
  id: string;
  children: React.ReactNode;
}

export const PanelWrapper: React.FC<IProps> = (props: IProps) => {
  return (
    <Panel id={props.id}>
      <Wrapper>{props.children}</Wrapper>
    </Panel>
  );
};

const Wrapper = styled.div`
  height: calc(100%);
  max-height: calc(100%);
  overflow: auto;
`;

const Panel = styled.div`
  height: 100%;
`;

export default PanelWrapper;
