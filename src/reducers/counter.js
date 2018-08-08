// import update from 'immutability-helper'

let initialState = {
  count: 0
}

const counter = (state = initialState, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return {count: state.count + 1}
    case 'DECREMENT':
      return {count: state.count - 1}
    default:
      return state
  }
}

export default counter
