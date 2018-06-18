import React, { Component } from 'react'

import { Button, Modal, FormControl, Form, FormGroup, ControlLabel } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'

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
        <FormattedMessage id='addProject.newProgect' defaultMessage='Add new project'>
          {value =>
            <Button bsStyle='primary' className='pull-right' onClick={this.handleShow}>{value}</Button>
          }
        </FormattedMessage>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <FormattedMessage id='addProject.modal.title' defaultMessage='Create new project'>
              {value =>
                <Modal.Title>{value}</Modal.Title>
              }
            </FormattedMessage>

          </Modal.Header>
          <Modal.Body>
            <Form>
              <FormGroup
                controlId='formControlsText'
                validationState={this.getValidationState()}
              >
                <FormattedMessage id='addProject.modal.inputLabel' defaultMessage='Project title'>
                  {value =>
                    <ControlLabel>{value}</ControlLabel>
                  }
                </FormattedMessage>
                <FormattedMessage id='addProject.modal.inputPlaceholder' defaultMessage='Enter text'>
                  {placeholder =>
                    <FormControl
                      type='text'
                      name='title'
                      value={this.state.text}
                      placeholder={placeholder}
                      onChange={this.handleChange}
                    />
                  }
                </FormattedMessage>
                <FormControl.Feedback />
              </FormGroup>

              <FormGroup controlId='formControlsFile'>
                <FormattedMessage id='addProject.modal.fileLabel' defaultMessage='File'>
                  {value =>
                    <ControlLabel>{value}</ControlLabel>
                  }
                </FormattedMessage>
                <FormattedMessage id='addProject.modal.filePlaceholder' defaultMessage='Chose file ...'>
                  {placeholder =>
                    <FormControl
                      type='file'
                      name='file'
                      placeholder={placeholder}
                      onChange={this.handleChange}
                    />
                  }
                </FormattedMessage>
                <FormControl.Feedback />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <FormattedMessage id='addProject.save' defaultMessage='Save'>
              {value =>
                <Button onClick={this.addProject}>{value}</Button>
              }
            </FormattedMessage>
            <FormattedMessage id='btn.cancel' defaultMessage='Close'>
              {value =>
                <Button onClick={this.handleClose}>{value}</Button>
              }
            </FormattedMessage>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    addProject: PropTypes.func.isRequired
  }
}
