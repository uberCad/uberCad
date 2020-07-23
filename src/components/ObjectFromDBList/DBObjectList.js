import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  ControlLabel,
  FormControl,
  FormGroup,
  Modal,
  HelpBlock,
  Button,
  ListGroup
} from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { drawDxf } from '../../actions/cad';
import { parseDxf } from '../../services/dxfService';
import './DBObjectList.css';
import Api from '../../services/apiService';
import sceneService from '../../services/sceneService';
import * as THREE from '../../extend/THREE';
import consoleUtils from '../../services/consoleUtils';

export default class DBObjectList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      title: '',
      file: null,
      show: false,
      error: '',
      ObjectFromDB: {},
      // backWay: '0',
      searchQuery: ''
    };
  }

  handleClose = () => {
    this.setState({ show: false });
  };

  handleShow = () => {
    this.getObject({});
    this.setState({
          show: true
    });
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
      console.log(this.props.editor);
      fileReader.onload = function() {
        let fileText = fileReader.result;
        drawDxf(parseDxf(fileText), container, null, editor);
        let { scene, camera, renderer } = editor;
        renderer.render(scene, camera);
      };
      fileReader.readAsText(file);
      this.props.editor.options.oldMode = this.props.editor.options.selectMode;
      this.props.chooseTool('MOVE_NEW_OBJECT');
      this.handleClose();
      this.setState({
        file: null
      });
    }
  };

  getObject = event => {
    let { currentTarget } = event;
    let way = currentTarget ? currentTarget.value : 0;
    Api.get(`/store/category/` + way) //done
      .then(ObjectFromDB => {
        this.setState({
          ObjectFromDB: ObjectFromDB
        });
      })
  };

  handleSearch = event => {
    this.setState({
      searchQuery: event.target.value.toLowerCase()
    });
  };

  choose = event => {
    let { currentTarget } = event;
    let editor = this.props.editor;
    let { scene, camera, renderer } = editor;

    Api.get(`/store/part/` + currentTarget.value) //done
      .then(loadObject => {
        let loader = new THREE.ObjectLoader();
        let object = loader.parse(loadObject.object);
        sceneService.fixSceneAfterImport(object);
        object.name = loadObject.title;
        scene.getObjectByName('Objects').add(object);
        console.log(object);
        this.handleClose();

        editor.editMode.activeLine.lines = object.children;
        // todo добавити рендер в списку обєктів
        this.props.editor.options.oldMode = this.props.editor.options.selectMode;
        this.props.chooseTool('MOVE_NEW_OBJECT');
        renderer.render(scene, camera);
      });
  };

  render() {
    return (
      <div>
        <div onClick={this.handleShow} className= "li-Header">
          <FormattedMessage id="header.store" defaultMessage="Store" />
        </div>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <FormattedMessage
              id="addElement.modal.title"
              defaultMessage="Add new element"
            >
              {value => <Modal.Title>{value}</Modal.Title>}
            </FormattedMessage>
          </Modal.Header>
          <Modal.Body>


            {/*todo це не баг, це фіча.... треба включити і закінчити реалізацію*/}
            {/*<Form>*/}
              {/*<FormGroup controlId="formControlsText">*/}
                {/*<FormattedMessage*/}
                  {/*id="material.modal.searchPlaceholder"*/}
                  {/*defaultMessage="Life search ..."*/}
                {/*>*/}
                  {/*{placeholder => (*/}
                    {/*<FormControl*/}
                      {/*type="text"*/}
                      {/*name="title"*/}
                      {/*placeholder={placeholder}*/}
                      {/*onChange={this.handleSearch}*/}
                      {/*autoFocus*/}
                    {/*/>*/}
                  {/*)}*/}
                {/*</FormattedMessage>*/}
                {/*<FormControl.Feedback />*/}
              {/*</FormGroup>*/}
            {/*</Form>*/}

            <ListGroup componentClass="ul" className="db-objects-list">
              {
                this.state.ObjectFromDB.category ?
                  this.state.ObjectFromDB.category.map(object => (
                    <li
                      className="list-group-flush"
                      value={object.parent_key}
                      onClick={this.getObject}
                        key={object.parent_key}
                    >
                      <h4 value={object.parent_key}>UP</h4>
                    </li>)): null}
              {
                this.state.ObjectFromDB.subCategories ?
                  this.state.ObjectFromDB.subCategories.map(object => (
                  <li
                    className="list-group-flush"
                    value={object._key}
                    onClick={this.getObject}
                      key={object._key}
                  >
                      <h4 value={object._key}>{object.title}</h4>
                      <span>Type: Folder</span>
                  </li>)): null}
              {this.state.ObjectFromDB.parts
                ? this.state.ObjectFromDB.parts.map(object => (
                    <li
                className="list-group-flush"
                value={object._key}
                onClick={this.choose}
                key = {object._key}
                >
                <h4 value={object._key}>{object.title} {object._key}</h4>
                      <span className="svgIcon col-sm-4 .col-md-4 .col-xs-4" >
                        {consoleUtils.getSvg(object.svgIcon)}
                        </span>
                      <span>Width: {object.width}</span>
                      <span>height: {object.height}</span>
                    </li>
                  ))
                : null}
            </ListGroup>
            <Form
              onSubmit={event => {
                event.preventDefault();
                return false;
              }}
            >
              <FormGroup controlId="formControlsFile">
                <FormattedMessage
                  id="addObject.modal.fileLabel"
                  defaultMessage="Load File"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addObject.modal.filePlaceholder"
                  defaultMessage="Chose file ..."
                >
                  {placeholder => (
                    <FormControl
                      type="file"
                      name="file"
                      accept=".dxf"
                      placeholder={placeholder}
                      onChange={this.handleChange}
                      // onClick = {this.tester}
                      onClick={e => e.stopPropagation()}
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
            <FormattedMessage id="addObject.open" defaultMessage="Open">
              {value => (
                <Button
                  href={
                    !this.props.editor.scene ? '/cad/editObjectElement' : ''
                  }
                  onClick={this.addObject}
                >
                  {value}
                </Button>
              )}
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
    chooseTool: PropTypes.func,
    ObjectFromDB: PropTypes.array,
    getObjectFromDB: PropTypes.func,
    loadObjectFromDB: PropTypes.func
  };
}