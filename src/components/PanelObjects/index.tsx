import React, { useState, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import sceneService from '../../services/sceneService';

import MaterialComponent from '../Material/materrialComponentContainer';
import Calculate from './CalculatePrice/container';
import AddToBD from './AddToBD/container';
import PanelWrapper from '../atoms/panel-wrapper';
import ButtonIcon from '../atoms/button-icon';

import { ISnapshot, IEditor } from '../../interfaces/shapshot';
import { Viewer } from '../../services/dxfService';
import { Object3D } from 'three';

const images = {
  showAll: require('../ActiveEntities/show-all.svg'),
  combine: require('../../assets/images/panel/combine.svg'),
  btnEdit: require('../../assets/images/panel/edit.svg'),
  btnUngroup: require('../../assets/images/panel/ungroup.svg'),
  btnAddToDB: require('../../assets/images/panel/add-element.svg')
};

export interface IDispatchProps {
  toggleVisible: (visible: boolean, editor: IEditor, entity?: Object3D) => void;
  combineEdgeModels: (editor: IEditor) => void;
  showAll: (editor: IEditor) => void;
  toggleObject: (editor: IEditor, object?: Object3D | null) => void;
  isEdit: (permission: boolean, editor: IEditor, object?: Object3D) => void;
  ungroup: (editor: IEditor, object?: Object3D) => void;
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

interface ICurrentSnapshot {
  titleSnapshot: string;
  objectKey: string;
}

type Props = IProps & IDispatchProps;

const PanelObjects: React.FC<Props> = (props: Props) => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<Array<
    ICurrentSnapshot
  > | null>(null);
  const [objectName, setObjectName] = useState<string | undefined>('');
  const [objectId, setObjectId] = useState<number>(0);

  const { scene } = props.editor;
  const [objects] = useState(scene ? sceneService.getObjects(scene) : null);

  const onChangeVisible = (event: React.FormEvent): void => {
    if (scene) {
      props.toggleVisible(
        event.currentTarget['checked'],
        props.editor,
        scene.getObjectById(
          parseInt(String(event.currentTarget['dataset'].id), 10)
        )
      );
    }
  };

  const edit = (event: React.FormEvent): void => {
    event.stopPropagation();
    if (scene && objectId !== 0) {
      props.isEdit(
        !props.editor.isEdit,
        props.editor,
        scene.getObjectById(objectId)
      );
    }
  };

  const ungroup = (event: React.FormEvent): void => {
    event.stopPropagation();
    if (scene && objectId !== 0) {
      props.ungroup(props.editor, scene.getObjectById(objectId));
    }
  };

  const toggleObject = (event: React.MouseEvent, id: number): void => {
    const { target, currentTarget } = event;

    if (target !== currentTarget) {
      return;
    }
    const object = scene.getObjectById(id);
    props.toggleObject(
      props.editor,
      object !== props.activeObject ? object : null
    );
  };

  const toggleShow = (event: React.MouseEvent): void => {
    event.stopPropagation();
    const objectName = scene.getObjectById(objectId)?.name;

    const currentSnapshot: Array<ICurrentSnapshot> = [];
    props.snapshots.forEach(item => {
      item.objects.forEach(obj => {
        if (obj.title === objectName) {
          currentSnapshot.push({
            titleSnapshot: item.title,
            objectKey: obj._key
          });
        }
      });
    });
    setIsShow(!isShow);
    setObjectName(objectName);
    setCurrentSnapshot(currentSnapshot);
  };

  const loadObjectSnapshot = (event: React.MouseEvent): void => {
    event.stopPropagation();
    let confirm;
    if (props.isChanged) {
      confirm = window.confirm(
        'Document is not saved. You will lost the changes if you load this snapshot.'
      );
    }
    if (!props.isChanged || confirm) {
      props.loadObjectSnapshot(
        String(event.currentTarget['dataset'].key),
        props.editor.cadCanvas
      );
    }
    setIsShow(false);
    setCurrentSnapshot(null);
  };

  return (
    <PanelWrapper id="panel-layers">
      {/* <div id="panel-layers"> */}
      <div className="content">
        {isShow && (
          <div className={`object-snapshot ${isShow ? 'show' : ''}`}>
            <h4>{`"${objectName}" snapshots:`}</h4>
            <ul>
              {currentSnapshot?.map((snap, idx) => (
                <li
                  key={idx}
                  data-key={snap.objectKey}
                  onClick={loadObjectSnapshot}
                >
                  {snap.titleSnapshot}
                </li>
              ))}
            </ul>
          </div>
        )}
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
                id="panelObject.checkboxVisibility"
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
              <span
                className="directions"
                onClick={toggleShow}
                data-id={object.id}
                title="Load object snapshots"
              />
              <span>{object.children.length}</span>
            </div>
          ))
        ) : (
          <FormattedMessage
            id="panelObject.noObjects"
            defaultMessage="No objects"
          />
        )}
      </div>

      <div className="toolbar">
        {objects?.children.length > 1 && (
          <FormattedMessage
            id="panelObject.combineEdgeModels"
            defaultMessage="Combine edge models"
          >
            {value => (
              <ButtonIcon
                id="combine"
                title={value}
                src={images.combine}
                onClick={() => props.combineEdgeModels(props.editor)}
              />
            )}
          </FormattedMessage>
        )}
        <FormattedMessage id="panelObject.showAll" defaultMessage="Show all">
          {value => (
            <ButtonIcon
              id="show-all"
              title={value}
              src={images.showAll}
              onClick={() => props.showAll(props.editor)}
            />
          )}
        </FormattedMessage>
        {props.activeObject && <MaterialComponent lang={props.lang} />}
        {props.activeObject && !props.editor.isEdit && (
          <ButtonIcon
            id="btn-edit"
            // title={value}
            src={images.btnEdit}
            onClick={event => {
              setObjectId(props.activeObject.id);
              edit(event);
            }}
          />
        )}
        {objects?.children.length > 0 && <Calculate lang={props.lang} />}

        {props.activeObject && !props.editor.isEdit && (
          <ButtonIcon
            id="btn-ungroup"
            // title={value}
            src={images.btnUngroup}
            onClick={event => {
              setObjectId(props.activeObject.id);
              ungroup(event);
            }}
          />
        )}

        {props.activeObject && <AddToBD lang={props.lang} />}
      </div>
      {/* </div> */}
    </PanelWrapper>
  );
};

export default memo(PanelObjects);
