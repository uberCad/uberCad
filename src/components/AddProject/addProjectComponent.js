import React, { Component } from 'react'

import { Button, Modal, FormControl, Form, FormGroup, ControlLabel } from 'react-bootstrap'

export default class AddProjectComponent extends Component {

  constructor (props) {
    super(props)
    this.state = {
      title: '',
      file: '',
      show: false
    }
  }

  getValidationState () {
    const length = this.state.title.length
    if (length > 10) return 'success'
    else if (length > 5) return 'warning'
    else if (length > 0) return 'error'
    return null
  }

  handleClose = () => {
    this.setState({show: false})
  }

  handleShow = () => {
    this.setState({show: true})
  }

  handleChange = (event) => {
    const name = event.target.name
    if (name === 'file') {
      this.setState({file: event.target.files[0]})
    } else {
      this.setState({[name]: event.target.value})
    }
  }

  addProject = () => {
    const project = new FormData()
    project.append('file', this.state.file)
    project.append('title', this.state.title)
    this.props.addProject(project)
    this.handleClose()
  }

  render () {
    return (
      <div>

        <Button bsStyle="primary" onClick={this.handleShow}>Add new Project</Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create new project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FormGroup
              controlId="formControlsText"
              validationState={this.getValidationState()}
            >
              <ControlLabel>Project title</ControlLabel>
              <FormControl
                type="text"
                name="title"
                value={this.state.text}
                placeholder="Enter text"
                onChange={this.handleChange}
              />
              <FormControl.Feedback/>
            </FormGroup>

            <FormGroup controlId="formControlsFile">
              <ControlLabel>File</ControlLabel>
              <FormControl
                type="file"
                name="file"
                placeholder="Chose file ..."
                onChange={this.handleChange}
              />
              <FormControl.Feedback/>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleClose}>Close</Button>
          <Button onClick={this.addProject}>Save</Button>
        </Modal.Footer>
      </Modal>
      </div>
    )
  }
}
