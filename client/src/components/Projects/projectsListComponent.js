import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { fetchProjects } from '../../actions/projects'

// https://daveceddia.com/where-fetch-data-redux/

export default class ProjectsListComponent extends Component {

    componentDidMount() {
        console.log('Projects: componentDidMount() props in component', this.props)

        const { dispatch /*, selectedFilter */} = this.props
        dispatch(fetchProjects(/*selectedFilter*/))
    }

    // componentWillReceiveProps(nextProps) {
    //     if (nextProps.selectedSubreddit !== this.props.selectedSubreddit) {
    //         const { dispatch, selectedSubreddit } = nextProps
    //         dispatch(fetchPostsIfNeeded(selectedSubreddit))
    //     }
    // }


    render () {
        console.log('ProjectsComponent: render()', this.props)

        const { items, loading, error } = this.props
        const isEmpty = 0 && items.length === 0
        return (
            <div>
                <h3>Projects list</h3>
                <h4>loading: {loading ? 'true' : 'false'}</h4>
                <h4>error: {error ? 'true' : 'false'}</h4>

                {isEmpty
                    ? (loading ? <h2>Loading...</h2> : <h2>Empty.</h2>)
                    : <div style={{ opacity: loading ? 0.5 : 1 }}>
                        {JSON.stringify(items)}
                        {/*<Posts posts={posts} />*/}
                    </div>
                }
            </div>
        )
    }

    static propTypes = {
        items: PropTypes.array.isRequired,
        loading: PropTypes.bool.isRequired,
        error: PropTypes.object,

    }
}