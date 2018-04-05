import { connect } from 'react-redux'
import ProjectsComponent from './projectsComponent'

const mapStateToProps = (state, ownProps) => {
  // console.error('mapStateToProps(state, ownProps)', state, ownProps)
  const { selectedFilter, projectsByFilter } = state
  const {
    loading,
    lastUpdated,
    items
  } = projectsByFilter[selectedFilter] || {
    loading: true,
    items: []
  }

  return {
    selectedFilter,
    items,
    loading,
    lastUpdated,
    ...ownProps
  }
}

export default connect(mapStateToProps)(ProjectsComponent)
// export default connect(mapStateToProps, mapDispatchToProps)(ProjectsFilterComponent)
