import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ProjectsList from '../ProjectsList/projectsListComponentContainer'
import AddProject from '../AddProject/addProjectComponentContainer'
import './Projects.css'
import { Row, Col } from 'react-bootstrap'

export default class ProjectsComponent extends Component {
  componentDidMount () {
    const {projectsFilter} = this.props
    this.props.fetchProjects(projectsFilter)
  }

  handleChange = ({currentTarget: {dataset: {option}}}) => {
    this.props.selectFilter(option)
  }

  render () {
    const {projectsFilter, items, loading} = this.props

    const isEmpty = 0 && items.length === 0
    return (
      <div className='Projects'>
        <ul className='ProjectsFilter'>
          {
            ['all', 'active', 'shared', 'archive', '[some bad filter...]'].map(option =>
              <li className={projectsFilter === option ? 'active' : ''} key={option} data-option={option} onClick={this.handleChange}>
                {option}
              </li>
            )
          }
        </ul>

        <Row className='component-head'>
          <Col xs={12} sm={6}>
            <h3>Projects list</h3>
          </Col>
          <Col xs={12} sm={6}>
            <AddProject />
          </Col>
        </Row>

        {isEmpty
          ? (loading ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          : <div style={{opacity: loading ? 0.5 : 1}}>
            <ProjectsList projects={items} />
          </div>
        }
      </div>
    )
  }

  static propTypes = {
    items: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    projectsFilter: PropTypes.string.isRequired,
    lastUpdated: PropTypes.number
  }
}
