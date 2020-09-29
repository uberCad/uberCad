import * as THREE from '../../extend/THREE';
import {
  setColor,
  setOriginalColor,
  getScale,
  addHelpPoints
} from '../../services/editObject';
import { disablePoint } from '../pointInfo';
import sceneService from '../../services/sceneService';
import GeometryUtils from '../../services/GeometryUtils';

export const EDIT_IS_EDIT = 'EDIT_IS_EDIT';
export const EDIT_CANCEL = 'EDIT_CANCEL';
export const EDIT_SAVE = 'EDIT_SAVE';

const cleanEdit = (data, dispatch) => {
  console.log('data', data);
  disablePoint()(dispatch);
  dispatch({
    type: data.type,
    payload: {
      previousScene: data.previousScene,
      scene: data.scene,
      undoData: {
        ...data.editMode,
        isChanged: true
      },
      editMode: {
        isEdit: false,
        beforeEdit: {},
        editObject: {},
        activeLine: {},
        selectPointIndex: null,
        clone: {
          active: false,
          point: null,
          cloneObject: null
        },
        move: {
          active: false,
          point: null,
          moveObject: null
        },
        rotation: {
          active: false,
          rotationObject: null,
          angle: 0
        },
        scale: {
          active: false,
          scaleObject: null,
          scale: 1
        }
      }
    }
  });
};

export const isEdit = (option, editor, object = {}) => {
  console.log('_________ isEdit _________');
  let activeLine = {};
  const { scene, camera, renderer } = editor;
  const previousScene = scene.clone();
  object.userData.parentName = object.parent.name;
  const beforeEdit = JSON.stringify(object);
  if (option) {
    scene.getObjectByName('HelpLayer').children = [];
    setColor(
      scene,
      new THREE.Color(0xaaaaaa),
      object.id,
      new THREE.Color(0x00ff00)
    );
  } else {
    setOriginalColor(scene);
  }
  if (object instanceof THREE.Line) {
    activeLine = object;
    const rPoint = getScale(camera);
    object.name = 'ActiveLine';
    addHelpPoints(object, scene, rPoint);
  }
  renderer.render(scene, camera);
  return dispatch =>
    dispatch({
      type: EDIT_IS_EDIT,
      payload: {
        isEdit: option,
        beforeEdit: beforeEdit,
        editObject: object,
        scene: editor.scene,
        previousScene,
        isChanged: true,
        activeLine
      }
    });
};

export const cancelEdit = (editor, { editObject, beforeEdit }) => {
  console.log('____________ cancelEdit _________');
  if (beforeEdit && !editObject.metadata) {
    // for developer after save/restart, editObject === json object
    const object = new THREE.ObjectLoader().parse(JSON.parse(beforeEdit));
    editObject.parent.remove(editObject);
    editor.scene.getObjectByName(object.userData.parentName).add(object);
  }
  editor.scene.getObjectByName('HelpLayer').children = [];
  sceneService.fixSceneAfterImport(editor.scene);
  GeometryUtils.fixObjectsPaths(editor.scene);
  setOriginalColor(editor.scene);
  editor.renderer.render(editor.scene, editor.camera);
  return dispatch => {
    cleanEdit(
      {
        scene: editor.scene,
        type: EDIT_CANCEL
      },
      dispatch
    );
  };
};

export const saveEdit = (editor, editMode) => {
  console.log('____________ saveEdit _________', editMode);
  editor.scene.getObjectByName('HelpLayer').children = [];
  const previousScene = editor.scene.clone();
  setOriginalColor(editor.scene);
  editor.renderer.render(editor.scene, editor.camera);
  return dispatch => {
    cleanEdit(
      {
        editMode,
        scene: editor.scene,
        previousScene,
        type: EDIT_SAVE
      },
      dispatch
    );
  };
};
