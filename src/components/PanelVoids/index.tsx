import React, { useState, useEffect, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import sceneService from '../../services/sceneService';

import PanelWrapper from '../atoms/panel-wrapper';
import ButtonIcon from '../atoms/button-icon';

import { ISnapshot, IEditor } from '../../interfaces/shapshot';
import { Viewer } from '../../services/dxfService';
import { Object3D } from 'three';

const images = {
  showAll: require('../ActiveEntities/show-all.svg'),
  btnEdit: require('../../assets/images/panel/edit.svg'),
  btnAddToDB: require('../../assets/images/panel/add-element.svg')
};

export interface IDispatchProps {
  toggleVisible: (visible: boolean, editor: IEditor, entity?: Object3D) => void;
  showAll: (editor: IEditor) => void;
  toggleObject: (editor: IEditor, object?: Object3D | null) => void;
  isEdit: (permission: boolean, editor: IEditor, object?: Object3D) => void;
  loadObjectSnapshot: (key: string, cadCanvas: Viewer) => void;
}

export interface IProps {
  activeObject: Object3D;
  editor: IEditor;
  isChanged: boolean;
  lang: string;
  objectsIds: Array<string>;
  snapshots: Array<ISnapshot>;
}

type Props = IProps & IDispatchProps;

const PanelVoidsLayer: React.FC<Props> = (props: Props) => {
  const { scene } = props.editor;

  const [objectId, setObjectId] = useState<number>(props.activeObject?.id);
  const [objects, setObjects] = useState(
    scene ? sceneService.getObjects(scene) : null
  );

  const onChangeVisible = (event: React.FormEvent): void => {
    //todo 05.11.2020
    debugger;
    if (scene && event) {
      props.toggleVisible(
        event.currentTarget['checked'],
        props.editor,
        scene.getObjectById(
          parseInt(String(event.currentTarget['dataset'].id), 10)
        )
      );
    }
  };

  const edit = (event: React.FormEvent, id: number): void => {
    event.stopPropagation();
    if (scene && objectId !== 0) {
      props.isEdit(!props.editor.isEdit, props.editor, scene.getObjectById(id));
    }
  };

  const toggleObject = (event: React.MouseEvent, id: number): void => {
    const { target, currentTarget } = event;
    if (target !== currentTarget) {
      return;
    }
    const object = scene.getObjectById(id);
    setObjectId(id);
    props.toggleObject(
      props.editor,
      object !== props.activeObject ? object : null
    );
  };

  useEffect(() => {
    setObjects(scene ? sceneService.getVoidsLayer(scene) : null);
  }, [scene]);

  return (
    <PanelWrapper id="panel-layers">
      <div className="content">
        {objects ? (
          objects.children.map((object, idx) => (
            <div
              className={`item ${
                props.activeObject === object ? 'active' : ''
              }`}
              key={idx}
              data-id={object.id}
              onClick={event => toggleObject(event, object.id)}
            >
              <FormattedMessage
                id="panelVoids.checkboxVisibility"
                defaultMessage="Visibility"
              >
                {value => (
                  <input
                    type="checkbox"
                    data-id={object.id}
                    title={value}
                    checked={object.visible}
                    onChange={onChangeVisible}
                  />
                )}
              </FormattedMessage>
              {object.name}
              <span>{object.children.length}</span>
            </div>
          ))
        ) : (
          <FormattedMessage
            id="panelVoids.noObjects"
            defaultMessage="No objects"
          />
        )}
      </div>

      <div className="toolbar">
        <FormattedMessage id="panelVoids.showAll" defaultMessage="Show all">
          {value => (
            <ButtonIcon
              id="show-all"
              title={value}
              src={images.showAll}
              onClick={() => props.showAll(props.editor)}
            />
          )}
        </FormattedMessage>
        {props.activeObject && !props.editor.isEdit && (
          <ButtonIcon
            id="btn-edit"
            src={images.btnEdit}
            onClick={event => {
              setObjectId(props.activeObject.id);
              edit(event, props.activeObject.id);
            }}
          />
        )}
      </div>
    </PanelWrapper>
  );
};

export default memo(PanelVoidsLayer);
