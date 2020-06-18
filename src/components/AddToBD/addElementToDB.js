import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Modal
} from 'react-bootstrap';
import './addElementToDB.css';
import { FormattedMessage } from 'react-intl';
import Scene from '../../services/sceneService';
import { drawDxf } from '../../actions/cad';
import { parseDxf } from '../../services/dxfService';
import MaterialComponent from '../Material/materrialComponentContainer';

export default class addElementToDB extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      file: null,
      show: false,
      error: '',
      type: '',
      material: ''
    };
  }

  handleClose = () => {
    this.setState({ show: false });
  };

  handleShow = () => {
    let target = this.props.activeObject.userData;
    this.setState({ error: '' });
    target.title = this.props.activeObject.name
      ? this.props.activeObject.name : '';

    if (!target.material) {
      target.material = {};
      target.material.name = '';
    }

    // todo той самий костиліще
    if (target.material.name === 'Chose material') {
      target.material.name = '';
    }

    this.setState({
      show: true,
      type: target.type ? target.type : '',
      title: target.title,
      material: target.material.name
    });
  };

  changeName = event => {
    this.parameterChange(event, 'title');
  };

  changeType = event => {
    this.parameterChange(event, 'type');
  };

  changeMaterial = () => {
    this.setState({
      material: ''
    });
  };

  parameterChange = (event, parameter) => {
    let target = this.props.activeObject.userData;
    let text = event.currentTarget.value;

    if (parameter === 'title') {
      this.setState({ title: text });
      target.name = text;
    } else if (parameter === 'type') {
      this.setState({ type: text });
      target.type = text;
    }
  };

  addObject = () => {
    const file = this.state.file;
    if (!file) {
      this.setState({ error: 'Missing project file' });
    } else {
      this.setState({ error: '' });
    }
    if (file) {
      let fileReader = new FileReader();
      let container = document.getElementById('sceneID');
      let editor = this.props.editor;
      // console.log(this.props.editor);
      fileReader.onload = function() {
        let fileText = fileReader.result;
        drawDxf(parseDxf(fileText), container, null, editor);
        let { scene, camera, renderer } = editor;
        renderer.render(scene, camera);
      };
      fileReader.readAsText(file);
      this.handleClose();
    }
  };

  sendObject = () => {
    let target = this.props.activeObject.userData;
    if (!target.title) {
      this.setState({ error: 'Missing element Name' });
    } else if (!target.type) {
      this.setState({ error: 'Missing element Type' });
    } else if (!target.material || target.material.name === 'Chose material') {
      this.setState({
        error: 'Missing element Material. Please choice material'
      });
    } else {
      this.setState({ error: '' });
    }
    console.log(target.material.name);
  };

  render() {
    const objects = Scene.getObjects(this.props.scene, true);

    let systemWeight = 0;
    objects.map(object => {
      if (object.userData.info)
        return (systemWeight += object.userData.info.weight);
      else return systemWeight;
    });

    return (
      <div>
        <FormattedMessage
          id="calculatePrice.btnCalculateTitle"
          defaultMessage="Calculate price"
        >
          {title => (
            <button
              onClick={this.handleShow}
              title={title}
              className="btn-addToDB"
            />
          )}
        </FormattedMessage>

        <Modal show={this.state.show} onHide={this.handleClose}>
          {/*// todo КОСТИЛІЩЕ.... ну або подивись можливо можна упростити процес з onClose*/}
          {
            <MaterialComponent
              addElementToDB={!this.state.material}
              onClose={() => {
                this.setState({
                  material: this.props.activeObject.userData.material.name
                });
              }}
            />
          }

          <Modal.Header closeButton>
            <FormattedMessage
              id="addElement.modal.title"
              defaultMessage="Add new element"
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
                  id="addElementToDB.modal.inputLabel"
                  defaultMessage="Element title"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addElementToDB.modal.inputPlaceholder"
                  defaultMessage="Enter information"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      name="Object name"
                      value={this.state.title}
                      placeholder={placeholder}
                      onChange={this.changeName}
                    />
                  )}
                </FormattedMessage>

                <FormattedMessage
                  id="addElementToDB.modal.inputType"
                  defaultMessage="Element title"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addElementToDB.modal.inputPlaceholderType"
                  defaultMessage="Enter information"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      name="Object Type"
                      value={this.state.type}
                      placeholder={placeholder}
                      onChange={this.changeType}
                    />
                  )}
                </FormattedMessage>

                <FormattedMessage
                  id="addElementToDB.modal.inputMaterial"
                  defaultMessage="Element title"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addElementToDB.modal.inputPlaceholderMaterial"
                  defaultMessage=" Chose material"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      name="Object material"
                      value={this.props.activeObject.userData.material.name}
                      placeholder={placeholder}
                      onClick={this.changeMaterial}
                    />
                  )}
                </FormattedMessage>
                <MaterialComponent />

                <FormControl.Feedback />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            {this.state.error && (
              <HelpBlock className="warning">{this.state.error}</HelpBlock>
            )}
            <FormattedMessage id="addObject.open" defaultMessage="Save">
              {value => <Button onClick={this.sendObject}>{value}</Button>}
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
    show: PropTypes.bool,
    polyamides: PropTypes.array,
    scene: PropTypes.object,
    form: PropTypes.object,
    activeObject: PropTypes.object,

    error: PropTypes.string,
    forceRender: PropTypes.object,
    calculate: PropTypes.func,
    calculateHide: PropTypes.func,
    order: PropTypes.func
  };
}
