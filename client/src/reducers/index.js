import { combineReducers } from 'redux'
// import main from './main'
import counter from './counter'
import projects from './projects'
import spinner from './spinner'

export default combineReducers({counter, projects, spinner})
