import React, { Component } from 'react';

import {
  Button,
  Modal,
  FormControl,
  Form,
  FormGroup,
  ControlLabel,
  HelpBlock
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import './AddProject.css';

export default class AddProjectComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      file: null,
      show: false,
      error: ''
    };
  }

  handleClose = () => {
    this.setState({ show: false });
  };

  handleShow = () => {
    this.setState({ show: true });
  };

  handleChange = event => {
    const name = event.target.name;
    if (name === 'file') {
      this.setState({
        file: event.target.files[0],
        error: ''
      });
    } else {
      this.setState({
        [name]: event.target.value,
        error: ''
      });
    }
  };

  addProject = () => {
    const titleLength = this.state.title.length;
    const file = this.state.file;
    if (titleLength <= 0) {
      this.setState({ error: 'Enter the name of the project' });
    } else if (!file) {
      this.setState({ error: 'Missing project file' });
    } else {
      this.setState({ error: '' });
    }

    if (titleLength > 0 && file) {
      const project = new FormData();
      project.append('file', this.state.file);
      project.append('title', this.state.title);
      project.append('fileName', this.state.file.name);
      this.props.addProject(project);
      this.handleClose();
    }
  };

  render() {
    return (
      <div>
        <FormattedMessage
          id="addProject.newProgect"
          defaultMessage="Add new project"
        >
          {value => (
            <Button
              bsStyle="primary"
              className="pull-right"
              onClick={this.handleShow}
            >
              {value}
            </Button>
          )}
        </FormattedMessage>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <FormattedMessage
              id="addProject.modal.title"
              defaultMessage="Create new project"
            >
              {value => <Modal.Title>{value}</Modal.Title>}
            </FormattedMessage>
          </Modal.Header>
          <Modal.Body>
            <Form
              onSubmit={event => {
                event.preventDefault();
                return false;
              }}
            >
              <FormGroup controlId="formControlsText">
                <FormattedMessage
                  id="addProject.modal.inputLabel"
                  defaultMessage="Project title"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addProject.modal.inputPlaceholder"
                  defaultMessage="Enter project title"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      name="title"
                      value={this.state.text}
                      placeholder={placeholder}
                      onChange={this.handleChange}
                    />
                  )}
                </FormattedMessage>
                <FormControl.Feedback />
              </FormGroup>

              <FormGroup controlId="formControlsFile">
                <FormattedMessage
                  id="addProject.modal.fileLabel"
                  defaultMessage="File"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addProject.modal.filePlaceholder"
                  defaultMessage="Chose file ..."
                >
                  {placeholder => (
                    <FormControl
                      type="file"
                      name="file"
                      accept=".dxf"
                      placeholder={placeholder}
                      onChange={this.handleChange}
                    />
                  )}
                </FormattedMessage>
                <HelpBlock>Only *.dxf file supported</HelpBlock>
                <FormControl.Feedback />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            {this.state.error && (
              <HelpBlock className="warning">{this.state.error}</HelpBlock>
            )}
            <FormattedMessage id="addProject.save" defaultMessage="Save">
              {value => <Button onClick={this.addProject}>{value}</Button>}
            </FormattedMessage>
            <FormattedMessage id="btn.cancel" defaultMessage="Close">
              {value => <Button onClick={this.handleClose}>{value}</Button>}
            </FormattedMessage>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    addProject: PropTypes.func.isRequired
  };
}
