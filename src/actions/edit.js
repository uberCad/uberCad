import * as THREE from '../extend/THREE'
import { setColor, setOriginalColor } from '../services/editObject'

export const EDIT_IS_EDIT = 'EDIT_IS_EDIT'

export const isEdit = (option, editor, object = {}) => {
  if (option) {
    let bgColor = new THREE.Color(0xaaaaaa)
    let objColor = new THREE.Color(0x00ff00)
    setColor(editor.scene, bgColor, object.name, objColor)
  } else {
    setOriginalColor(editor.scene)
  }
  editor.renderer.render(editor.scene, editor.camera)
  const beforeEdit = JSON.stringify(object)
  return dispatch => dispatch({
    type: EDIT_IS_EDIT,
    payload: {
      isEdit: option,
      beforeEdit: beforeEdit,
      editObject: object,
      scene: editor.scene
    }
  })
}
