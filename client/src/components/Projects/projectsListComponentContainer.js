import { connect } from 'react-redux'
// import { changeStateProps } from '../../actions'
// import { fetchProjects } from '../../actions/projects'
import ProjectsListComponent from './projectsListComponent'

const mapStateToProps = (state, ownProps) => {
    console.log('mapStateToProps(state, ownProps)', state, ownProps)
    return {
        items: state.projects.items,
        loading: state.projects.loading,
        error: state.projects.error,
        ...ownProps
    }
}

// const mapDispatchToProps = (dispatch, ownProps) => {
//     console.log('mapDispatchToProps = (dispatch, ownProps)', dispatch, ownProps)
//
//     return {
//         changeStateProps: (prop, value) => {
//             console.log('dispatch(changeStateProps(prop, value))')
//             dispatch(changeStateProps(prop, value))
//         },
//         fetchProjects: () => {
//
//             console.error('hello!');
//
//             let dispatchData = fetchProjects()
//             console.log('dispatch(fetchProjects())', dispatchData(dispatch))
//             // dispatch(dispatchData)
//         }
//
//     }
// }

export default connect(mapStateToProps)(ProjectsListComponent)
// export default connect(mapStateToProps, mapDispatchToProps)(ProjectsListComponent)
