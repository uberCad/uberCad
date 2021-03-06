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
import { FormattedMessage } from 'react-intl';

import Api from '../../../services/apiService';
import Scene from '../../../services/sceneService';
import GeometryUtils from '../../../services/GeometryUtils';

import MaterialComponent from '../../Material/materrialComponentContainer';
import ButtonIcon from '../../atoms/button-icon';

import './addElementToDB.css';

const images = {
  btnAddToDB: require('../../../assets/images/panel/add-element.svg')
};

// TODO: delete it if we don't need it anymore
// import { drawDxf } from '../../actions/cad';
// import { parseDxf } from '../../services/dxfService';

export default class addElementToDB extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      file: null,
      show: false,
      error: '',
      type: '',
      material: '',
      category: ''
    };
  }

  handleClose = () => {
    this.setState({
      show: false,
      category: ''
    });
  };

  handleShow = () => {
    let target = this.props.activeObject.userData;
    this.setState({ error: '' });
    target.title = this.props.activeObject.name
      ? this.props.activeObject.name
      : '';

    if (!target.material) {
      target.material = {};
      target.material.name = '';
    }

    // todo той самий костиліще
    if (target.material.name === 'Choose material') {
      target.material.name = '';
    }

    this.setState({
      show: true,
      type: target.type ? target.type : '',
      title: target.title,
      material: target.material.name
    });
    if (!this.state.category) {
      Api.get(`/store/category/all`) //done
        .then(categoryFromDB => {
          this.categoryСonstructor(categoryFromDB);
        });
    }
  };

  categoryСonstructor = categoryFromDB => {
    let allCategories = [];
    let parent_keys = [];
    categoryFromDB.forEach(category => {
      for (let i = 0; i < parent_keys.length; i++) {
        if (parent_keys[i] === category.parent_key) {
          return;
        }
      }
      parent_keys[parent_keys.length] = category.parent_key;
    });

    this.recursiveStructuring(categoryFromDB, allCategories, parent_keys, 0, 0);

    console.log(allCategories);
    for (let i = 0; i < allCategories.length; i++) {
      console.log(allCategories[i].title);
    }
    this.setState({
      category: allCategories
    });
  };

  recursiveStructuring = (
    categoryFromDB,
    allCategories,
    parent_keys,
    thisParentKey,
    ind
  ) => {
    categoryFromDB.forEach(category => {
      // only '==' not '===' - different value types
      if (String(thisParentKey) === String(category.parent_key)) {
        for (let j = 0; j < ind; j++) {
          category.title = '-' + category.title;
        }
        allCategories.push(category);
        for (let i = 0; i < parent_keys.length; i++) {
          if (String(parent_keys[i]) === String(category._key)) {
            this.recursiveStructuring(
              categoryFromDB,
              allCategories,
              parent_keys,
              category._key,
              ind + 1
            );
          }
        }
      }
    });
    ind -= 1;
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
      target.title = text;
    } else if (parameter === 'type') {
      this.setState({ type: +event.target.selectedOptions.value });
      target.type = text;
    }
  };

  // addObject = () => {
  //   const file = this.state.file;
  //   if (!file) {
  //     this.setState({ error: 'Missing project file' });
  //   } else {
  //     this.setState({ error: '' });
  //   }
  //   if (file) {
  //     let fileReader = new FileReader();
  //     let container = document.getElementById('sceneID');
  //     let editor = this.props.editor;
  //     // console.log(this.props.editor);
  //     fileReader.onload = function() {
  //       let fileText = fileReader.result;
  //       drawDxf(parseDxf(fileText), container, null, editor);
  //       let { scene, camera, renderer } = editor;
  //       renderer.render(scene, camera);
  //     };
  //     fileReader.readAsText(file);
  //     this.handleClose();
  //   }
  // };

  sendObject = () => {
    let target = this.props.activeObject;
    if (!target.userData.title) {
      this.setState({ error: 'Missing element Name' });
    } else if (
      !target.userData.material ||
      target.userData.material.name === 'Choose material'
    ) {
      this.setState({
        error: 'Missing element Material. Please choice material'
      });
    } else {
      let boundingBox = GeometryUtils.getBoundingBox(target);
      this.setState({ error: '' });
      this.props.sendToDB(target, boundingBox);
      this.handleClose();
    }
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
            <ButtonIcon
              id={'btn-addToDB'}
              title={title}
              src={images.btnAddToDB}
              onClick={this.handleShow}
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
                <FormGroup controlId="exampleForm.ControlSelect1">
                  <FormGroup controlId="group">
                    <ControlLabel>Group</ControlLabel>
                    <FormControl
                      componentClass="select"
                      placeholder="Group"
                      // inputRef={(ref) => { this.state.groupSelect = ref }}
                      onChange={this.changeType}
                    >
                      <option></option>
                      {this.state.category
                        ? this.state.category.map(category => (
                            <option key={category._key} value={category._key}>
                              {category.title}
                            </option>
                          ))
                        : null}
                    </FormControl>
                  </FormGroup>
                </FormGroup>
                <FormattedMessage
                  id="addElementToDB.modal.inputMaterial"
                  defaultMessage="Element title"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addElementToDB.modal.inputPlaceholderMaterial"
                  defaultMessage=" Choose material"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      name="Object material"
                      value={this.props.activeObject.userData.material.name}
                      placeholder={placeholder}
                      onClick={this.changeMaterial}
                      onChange={this.changeMaterial}
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
