import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import './ProjectsList.css'
import { Row, Col } from 'react-bootstrap'

export default class ProjectsListComponent extends Component {
  render () {
    let {projects} = this.props
    return (
      <div className="data-projects">
        <Row className="table-head">
          <Col xs={0} sm={1} className="table-head-name"/>
          <Col xs={3} sm={3} className="hidden-sm-down table-head-name">title</Col>
          <Col xs={3} sm={2} className="hidden-sm-down table-head-name">created by</Col>
          <Col xs={2} sm={2} className="hidden-sm-down table-head-name">rating
            <br/>
            <span>price/efficiency</span>
          </Col>
          <Col xs={2} sm={2} className="hidden-sm-down table-head-name">details</Col>
          <Col xs={2} sm={2} className="hidden-sm-down table-head-name">status</Col>
        </Row>
        {
          projects.map((project, i) =>
            <Row key={i} className="table-row">
              <Col xs={1} className="table-data icon">
                <i className="fa fa-cubes fa-eye"/>
              </Col>
              <Col xs={3} className="table-data title">
                <Link to={`/project/${project._key}`}>project: {project.title}</Link>
                <p>34 minutes ago hardcoded</p>
              </Col>
              <Col xs={2} className="table-data">
                project - createdBy
                <p>Project manager hardcoded</p>
              </Col>

              <Col xs={2} className="table-data">{project.rating}</Col>
              <Col xs={2} className="table-data">{project.description}</Col>
              <Col xs={1} className="table-data">in progress</Col>
            </Row>
          )
        }
      </div>
    )
  }

  static propTypes = {
    projects: PropTypes.array.isRequired
  }
}
