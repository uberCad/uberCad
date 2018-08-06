import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import ProjectComponent from './projectComponent'
import {
  delProject,
  fetchProject,
  renameProject,
  renameSnapshot,
  saveProjectTitle,
  saveSnapshotTitle
} from '../../actions/project'

const mapStateToProps = (state, ownProps) => {
  return {
    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
    id: state.project.id,
    lastUpdated: state.project.lastUpdated,
    preloadedProject: getPreloadedProject(state, ownProps),
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProject: function (id, preloadedProject) {
      fetchProject(id, preloadedProject)(dispatch)
    },
    delProject: function (key) {
      delProject(key)(dispatch)
    },
    renameProject: function (title) {
      renameProject(title)(dispatch)
    },
    saveProjectTitle: function (key, title) {
      saveProjectTitle(key, title)(dispatch)
    },
    renameSnapshot: function (snapshot) {
      renameSnapshot(snapshot)(dispatch)
    },
    saveSnapshotTitle: function (snapshot) {
      saveSnapshotTitle(snapshot)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectComponent)

export const getPreloadedProject = createSelector(
  function getId (state, props) {
    return props.match.params.id
  },
  function getList (state) {
    return state.projectsByFilter
  },
  (id, projectsByFilter) => {
    console.log('calculate preloaded project')

    // try to find basic info about project in storage
    try {
      let keys = Object.keys(projectsByFilter)

      for (let key of keys) {
        let projects = projectsByFilter[key].items
        if (Array.isArray(projects)) {
          let project = projects.find(project => parseInt(project.id, 10) === parseInt(id, 10))
          if (project) {
            let projectToThrow = {
              ...project,
              title: project.title + ' LOADING!!!'
            }
            throw projectToThrow
          }
        }
      }
    } catch (project) {
      return project
    }
    return null
  }
)
