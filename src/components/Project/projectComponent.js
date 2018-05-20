import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Row, Col } from 'react-bootstrap'

export default class ProjectComponent extends Component {
  componentDidMount () {
    const {id} = this.props.match.params
    const {preloadedProject} = this.props
    this.props.fetchProject(id, preloadedProject)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.match.params.id !== this.props.match.params.id) {
      const {id} = nextProps.match.params
      const {preloadedProject} = nextProps
      this.props.fetchProject(id, preloadedProject)
    }
  }

  render () {
    const {project} = this.props

    return (
      <div className='project-page'>
        <h1>Project:</h1>
        {project && (
          <div>
            <Row className='table-head'>
              <Col xs={0} sm={1} className='table-head-name'/>
              <Col xs={3} sm={3} className='hidden-sm-down table-head-name'>title</Col>
              <Col xs={3} sm={2} className='hidden-sm-down table-head-name'>created by</Col>
              <Col xs={2} sm={2}
                   className='hidden-sm-down table-head-name'>rating<br/><span>price/efficiency</span></Col>
              <Col xs={2} sm={2} className='hidden-sm-down table-head-name'>details</Col>
              <Col xs={2} sm={2} className='hidden-sm-down table-head-name'>status</Col>
            </Row>

            {
              project.snapshots.map((snapshot, i) =>
                <Row key={i} className='table-row'>
                  <Col xs={1} className='table-data icon'>
                    <i className='fa fa-cubes fa-eye'/>
                  </Col>
                  <Col xs={3} className='table-data title'>
                    <Link to={`/cad/${project._key}/${snapshot._key}`}>{snapshot.title}</Link>
                    <p>34 minutes ago hardcoded</p>
                  </Col>
                  <Col xs={2} className='table-data'>
                    project - createdBy
                    <p>Project manager hardcoded</p>
                  </Col>

                  <Col xs={2} className='table-data'>rating...</Col>
                  <Col xs={2} className='table-data'>description...</Col>
                  <Col xs={1} className='table-data'>in progress</Col>
                </Row>
              )
            }

            <Row className='table-row'>
              <Col xs={1} className='table-data icon'>
                <i className='fa fa-cubes fa-eye'/>
              </Col>
              <Col xs={3} className='table-data title'>
                <Link to={`/cad/${project._key}`}>{project.title}</Link>
                <p>34 minutes ago hardcoded</p>
              </Col>
              <Col xs={2} className='table-data'>
                project - createdBy
                <p>Project manager hardcoded</p>
              </Col>

              <Col xs={2} className='table-data'>rating...</Col>
              <Col xs={2} className='table-data'>description...</Col>
              <Col xs={1} className='table-data'>in progress</Col>
            </Row>
          </div>)}
      </div>
    )
  }

  static propTypes = {
    // projectsList: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    project: PropTypes.object,
    lastUpdated: PropTypes.number
  }
}
