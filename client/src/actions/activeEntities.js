export const ACTIVE_ENTITIES_action = 'ACTIVE_ENTITIES_action'

export const someAction = data => {
  return dispatch => dispatch({
    type: ACTIVE_ENTITIES_action,
    payload: {
      data
    }
  })
}
