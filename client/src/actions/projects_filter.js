export const PROJECTS_SELECT_FILTER = 'PROJECTS_SELECT_FILTER'

export const selectFilter = filter => {
  return dispatch => dispatch({
    type: PROJECTS_SELECT_FILTER,
    payload: {filter}
  })
}
