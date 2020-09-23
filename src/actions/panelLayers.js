import sceneService from '../services/sceneService';

import { CAD_TOGGLE_VISIBLE_LAYER } from './cad';

export const PANEL_LAYERS_TOGGLE = 'PANEL_LAYERS_TOGGLE';

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

export const toggleLayer = (editor, layer) => {
  sceneService.setPointOfInterest(editor, layer ? layer : editor.scene);
  return dispatch => {
    dispatch({
      type: PANEL_LAYERS_TOGGLE,
      payload: {
        activeLayer: layer
      }
    });
  };
};
