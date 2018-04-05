import { combineReducers } from 'redux'
import counter from './counter'
import { projectsByFilter, selectedFilter } from './projects'
import project from './project'
import spinner from './spinner'

export default combineReducers({
  counter,
  projectsByFilter,
  selectedFilter,
  project,
  spinner
})
