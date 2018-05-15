import {
  ADD_PROJECT
} from '../actions/addProject'

let initialState = {}

const addProject = (state = initialState, action) => {
  switch (action.type) {
    case ADD_PROJECT:
      return {
        ...state
      }
    default:
      return state
  }
}

export default addProject
