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

import './VoidSearchPanel.css';
import edgeService from '../../../services/edgeService';

const images = {
  btnAddToDB: require('../../../assets/images/panel/combine.svg')
};

export default class VoidSearchPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ignoredDistance: '0.00001',
      minArea: '0.001',
      show: false,
      error: '',
      threshold: '0.001'
    };
  }

  handleClose = () => {
    this.setState({
      show: false,
      category: ''
    });
  };

  handleShow = () => {
    this.props.editor.voidSearchOptions.threshold = 0.001;
    this.props.editor.voidSearchOptions.minArea = 0.001;
    this.props.editor.voidSearchOptions.ignoredDistance = 0.00001;
    this.props.editor.voidSearchOptions.autoFix = true;
    this.setState({ error: '' });
    this.setState({
      show: true,
    });
  };

  showIntersectPoint = () => {
    this.handleClose();
    setTimeout(() => {
      let res = this.props.searchColPoints(this.props.editor);
      console.log (res);
      // ToDo NOOOOOOOOOOOOOOOOOOOOOO!!!!!!
      //  we must delete setTimeout
      setTimeout(() => {
        let confirm = window.confirm(
          'To search for voids press "ok". ' +
          'If not all points were found go back and change the parameters.'
        );
        if (confirm === true) {
          this.startSearchVoids();
        } else if (confirm === false) {
          this.handleShow();
        }
      }, 2);
    }, 2);
  };

  startSearchVoids = () => {
    this.props.combineEdgeModels(this.props.editor);
  };

  changeThreshold = ({ currentTarget: { value } }) => {
    debugger;
    if (!isNaN( +value)) {
      this.setState({ threshold: value });
      this.props.editor.voidSearchOptions.threshold = +value;
    }
  };

  changeMinArea = ({ currentTarget: { value } }) => {
    if (!isNaN( +value)) {
      this.setState({ minArea: value });
      this.props.editor.voidSearchOptions.minArea = +value;
    }
  };

  changeIgnoredDistance = ({ currentTarget: { value } }) => {
    if (!isNaN( +value)) {
      this.setState({ ignoredDistance: value });
      this.props.editor.voidSearchOptions.ignoredDistance = +value;
    }
  };

  onChangeAutoFix = ({ currentTarget: { checked } }) => {
    this.props.editor.voidSearchOptions.autoFix = checked;
  };

  render() {
    const {
      minArea,
      ignoredDistance,
      threshold
    } = this.props.editor.voidSearchOptions;
    const objects = Scene.getObjects(this.props.scene, true);
    let systemWeight = 0;
    objects.map(object => {
      if (object.userData.info)
        return (systemWeight += object.userData.info.weight);
      else return systemWeight;
    });

    // todo пофиксити ідішніки

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

          <Modal.Header closeButton>
            <FormattedMessage
              id="voidSearch.title"
              defaultMessage="take search parameters"
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
                  id="voidSearch.modal.inputLabel"
                  defaultMessage="min void area"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>

                <FormattedMessage
                  id="voidSearch.modal.minArea"
                  // defaultMessage="Enter information"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      min="0.000001"
                      max="0.1"
                      value={this.state.minArea}
                      onChange={this.changeMinArea}
                    />
                  )}
                </FormattedMessage>

                <FormattedMessage
                  id="voidSearch.modal.inputLabel"
                  defaultMessage="ignored distance between objects"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>

                <FormattedMessage
                  id="voidSearch.modal.ignoredDistance"
                  // defaultMessage="Enter information"
                >
                  {placeholder => (
                    <FormControl
                      type="text"
                      min="0.000001"
                      max="0.1"
                      value={this.state.ignoredDistance}
                      onChange={this.changeIgnoredDistance}
                    />
                  )}
                </FormattedMessage>

                <FormattedMessage
                  id="voidSearch.modal.autofix"
                >
                  {value => (
                    <input
                      type="checkbox"
                      title={value}
                      defaultChecked={true}
                      onChange={this.onChangeAutoFix}
                    />
                  )}
                </FormattedMessage>
                <FormattedMessage
                  id="voidSearch.modal.autofixlabelSameLayer"
                  defaultMessage="Voids autoFix"
                >
                  {value => (
                    <label htmlFor="editor-options-singleLayerSelect">
                      {value}
                    </label>
                  )}
                </FormattedMessage>

          {/*      <FormattedMessage*/}
          {/*        id="voidSearch.modal.inputType"*/}
          {/*        defaultMessage="Element title"*/}
          {/*      >*/}
          {/*        {value => <ControlLabel>{value}</ControlLabel>}*/}
          {/*      </FormattedMessage>*/}
          {/*      <FormGroup controlId="exampleForm.ControlSelect1">*/}
          {/*        <FormGroup controlId="group">*/}
          {/*          <ControlLabel>Group</ControlLabel>*/}
          {/*          <FormControl*/}
          {/*            componentClass="select"*/}
          {/*            placeholder="Group"*/}
          {/*            // inputRef={(ref) => { this.state.groupSelect = ref }}*/}
          {/*            onChange={this.changeType}*/}
          {/*          >*/}
          {/*            <option></option>*/}
          {/*            {this.state.category*/}
          {/*              ? this.state.category.map(category => (*/}
          {/*                  <option key={category._key} value={category._key}>*/}
          {/*                    {category.title}*/}
          {/*                  </option>*/}
          {/*                ))*/}
          {/*              : null}*/}
          {/*          </FormControl>*/}
          {/*        </FormGroup>*/}
          {/*      </FormGroup>*/}
          {/*      <FormattedMessage*/}
          {/*        id="voidSearch.modal.inputMaterial"*/}
          {/*        defaultMessage="Element title"*/}
          {/*      >*/}
          {/*        {value => <ControlLabel>{value}</ControlLabel>}*/}
          {/*      </FormattedMessage>*/}
          {/*      <FormattedMessage*/}
          {/*        id="voidSearch.modal.inputPlaceholderMaterial"*/}
          {/*        defaultMessage=" Choose material"*/}
          {/*      >*/}
          {/*        {placeholder => (*/}
          {/*          <FormControl*/}
          {/*            type="text"*/}
          {/*            name="Object material"*/}
          {/*            value={this.props.activeObject.userData.material.name}*/}
          {/*            placeholder={placeholder}*/}
          {/*            onClick={this.changeMaterial}*/}
          {/*            onChange={this.changeMaterial}*/}
          {/*          />*/}
          {/*        )}*/}
          {/*      </FormattedMessage>*/}

          {/*      <FormControl.Feedback />*/}
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            {this.state.error && (
              <HelpBlock className="warning">{this.state.error}</HelpBlock>
            )}
            <FormattedMessage id="voidSearch.search" defaultMessage="Show points">
              {value => <Button
                onClick={this.handleClose}
                onClick={this.showIntersectPoint}>{value}
              </Button>}
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
