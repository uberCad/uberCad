import {
  CAD_TOGGLE_VISIBLE,
  CAD_DO_SELECTION,
  CAD_SHOW_ALL,
  CAD_GROUP_ENTITIES,
  CAD_SELECT_LINE
} from './cad';
import sceneService from '../services/sceneService';

export const toggleVisible = (entity, visible, editor) => {
  return dispatch => {
    entity.visible = visible;
    sceneService.render(editor);

    dispatch({
      type: CAD_TOGGLE_VISIBLE,
      payload: {
        entity
      }
    });
  };
};

export const unSelect = (idx, activeEntities, editor) => {
  return dispatch => {
    sceneService.highlightEntities(
      editor,
      editor.activeEntities,
      true,
      undefined,
      false
    );
    activeEntities.splice(idx, 1);
    sceneService.highlightEntities(editor, editor.activeEntities);

    dispatch({
      type: CAD_DO_SELECTION,
      payload: {
        activeEntities,
        activeLine: null
      }
    });
  };
};

export const selectEntity = (idx, activeEntities, editor) => {
  return dispatch => {
    sceneService.highlightEntities(
      editor,
      editor.activeEntities,
      true,
      undefined,
      false
    );
    sceneService.highlightEntities(editor, activeEntities[idx]);
    sceneService.setPointOfInterest(editor, activeEntities[idx]);
    console.log('selectEntity', activeEntities[idx]);
    const activeLine = activeEntities[idx];
    dispatch({
      type: CAD_SELECT_LINE,
      payload: {
        activeLine
      }
    });
  };
};

export const showAll = (editor, mode) => {
  return dispatch => {
    const previousScene = editor.scene.clone();
    sceneService.showAll(editor, mode);
    dispatch({
      type: CAD_SHOW_ALL,
      payload: {
        activeEntities: editor.activeEntities,
        scene: editor.scene,
        previousScene
      }
    });
  };
};

export const groupEntities = editor => {
  return dispatch => {
    let object = sceneService.groupEntities(editor, editor.activeEntities);
    if (object) {
      dispatch({
        type: CAD_GROUP_ENTITIES,
        payload: {
          object,
          isChanged: true
        }
      });
    }
  };
};
