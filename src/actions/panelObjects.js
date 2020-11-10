import * as THREE from '../extend/THREE';

import sceneService from '../services/sceneService';
import edgeService from '../services/edgeService';
import snapshotService from '../services/snapshotService';
import GeometryUtils from '../services/GeometryUtils';
import consoleUtils from '../services/consoleUtils';

import { spinnerHide, spinnerShow } from './spinner';
import { CAD_TOGGLE_VISIBLE_LAYER, CAD_COMBINE_EDGE_MODELS } from './cad';
import { SPINNER_SHOW, SPINNER_HIDE } from './spinner';

export const PANEL_VOIDS_TOGGLE = 'PANEL_VOIDS_TOGGLE';
export const PANEL_OBJECTS_TOGGLE = 'PANEL_OBJECTS_TOGGLE';
export const SNAPSHOT_LOAD_OBJECT = 'SNAPSHOT_LOAD_OBJECT';

export const toggleVoids = (editor, object) => {
  sceneService.setPointOfInterest(editor, object ? object : editor.scene);
  return dispatch => {
    dispatch({
      type: PANEL_VOIDS_TOGGLE,
      payload: {
        activeObject: object
      }
    });
  };
};

export const toggleObject = (editor, object) => {
  sceneService.setPointOfInterest(editor, object ? object : editor.scene);
  return dispatch => {
    dispatch({
      type: PANEL_OBJECTS_TOGGLE,
      payload: {
        activeObject: object
      }
    });
  };
};

export const toggleVisible = (layer, visible, editor) => {
  return dispatch => {
    const { scene } = editor;
    const previousScene = scene.clone();
    layer.visible = visible;
    sceneService.render(editor);

    dispatch({
      type: CAD_TOGGLE_VISIBLE_LAYER,
      payload: {
        layer,
        scene,
        previousScene
      }
    });
  };
};

export const searchColPoints = editor => {
  return dispatch => {
    dispatch({ type: SPINNER_SHOW });
      const {collisionPoints} = edgeService.searchColPoints(editor, true);
      console.log (editor.voidSearchOptions);
      editor.voidSearchOptions.ColPoints = collisionPoints;
    console.log (editor.voidSearchOptions);
    dispatch({ type: SPINNER_HIDE });
  };
};

export const combineEdgeModels = editor => {
  return dispatch => {
    const { svg } = edgeService.combineEdgeModels(editor, true);
    try {
      // consoleUtils.previewObjectInConsole(svg);
      sceneService.createSVG(svg).then(() => {
        dispatch({ type: SPINNER_HIDE });
        dispatch({
          type: CAD_COMBINE_EDGE_MODELS,
          payload: {}
        });
      });
      // sceneService.sendToFlixo(svg);
    } catch (e) {
      console.error(e);
    }
  };
};

export const loadObjectSnapshot = (key, cadCanvas) => {
  return dispatch => {
    dispatch(spinnerShow());

    snapshotService
      .getObjectSnapshot(key)
      .then(snapshot => {
        dispatch(spinnerHide());
        const scene = cadCanvas.getScene();
        let loader = new THREE.ObjectLoader();
        const object = loader.parse(JSON.parse(snapshot.parameters));
        sceneService.fixSceneAfterImport(object);
        const oldObject = scene.getObjectByName(object.name);
        oldObject.parent.remove(oldObject);
        const objects = scene.getObjectByName('Objects');
        objects.add(object);

        GeometryUtils.fixObjectsPaths(scene);
        cadCanvas.render();

        let objectsIds = [];
        if (objects.children) {
          objectsIds = objects.children.map(item => item.id);
        }
        dispatch({
          type: SNAPSHOT_LOAD_OBJECT,
          payload: {
            scene,
            objectsIds,
            isChanged: true
          }
        });
      })
      .catch(console.error);
  };
};
