import { combineReducers } from 'redux'
import counter from './counter'
import projectsByFilter from './projects'
import projectsFilter from './projects_filter'


import project from './project'
import spinner from './spinner'

export default combineReducers({
  counter,
  projectsByFilter,
  projectsFilter,
  project,
  spinner
})
