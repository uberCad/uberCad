export const BINDING_CHECK = 'BINDING_CHECK'

export const checkBinding = (scene, idx, checked) => {
  scene.userData.binding[idx].active = checked
  return dispatch => {
    dispatch({
      type: BINDING_CHECK,
      payload: {idx, checked}
    })
  }
}

export const setBinding = (scene, binding) => {
  scene.userData.binding = binding
}
