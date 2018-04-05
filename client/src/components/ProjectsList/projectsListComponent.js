import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

export default class ProjectsListComponent extends Component {

  componentWillMount () {
    console.log('this.props', this.props)
  }

  // const Posts = ({posts}) => (
  //   <ul>
  //     {posts.map((post, i) =>
  //       <li key={i}>{post.title}</li>
  //     )}
  //   </ul>
  // )

  render () {
    let {projects} = this.props
    return (
      <ul>


        {
          projects.map((project, i) =>
            <li key={i}>
              <h3>{project.title}</h3>
              <Link to={`/project/${project.id}`}>Go to project (id: {project.id})</Link>
            </li>
          )
        }
      </ul>
    )
  }

  static propTypes = {
    projects: PropTypes.array.isRequired,
  }
}