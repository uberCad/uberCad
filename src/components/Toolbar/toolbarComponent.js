// ICONS: https://www.flaticon.com/free-icon/computer-mouse-cursor_70358#term=cursor&page=1&position=11

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
// TODO: delete it if not needed
// import {
//   Button,
//   ControlLabel,
//   Form,
//   FormControl,
//   FormGroup,
//   HelpBlock,
//   Modal
// } from 'react-bootstrap';
// import { drawDxf } from '../../actions/cad';
// import { parseDxf } from '../../services/dxfService';

import './Toolbar.css';
import '../AddProject/AddProject.css';
import toolPoint from './point.svg';
import toolSelect from './select.svg';
import toolUndo from './undo.svg';
import toolRedo from './redo.svg';
import toolLine from './line.svg';
import toolCurve from './curve.svg';
import toolMeasurement from './measurement.svg';
import toolCopyPaste from './copy.svg';
import toolBorderRadius from './borderRadius.svg';
import toolFacet from './facet.svg';

// export const ADD_ELEMENT = 'ADD_ELEMENT';
export const TOOL_POINT = 'TOOL_POINT';
export const TOOL_SELECT = 'TOOL_SELECT';
export const TOOL_UNDO = 'TOOL_UNDO';
export const TOOL_REDO = 'TOOL_REDO';
export const TOOL_NEW_CURVE = 'TOOL_NEW_CURVE';
export const TOOL_MEASUREMENT = 'TOOL_MEASUREMENT';
export const TOOL_LINE = 'TOOL_LINE';
export const TOOL_COPY_PASTE = 'TOOL_COPY_PASTE';
export const TOOL_BORDER_RADIUS = 'TOOL_BORDER_RADIUS';
export const TOOL_FACET = 'TOOL_FACET';

export default class ToolbarComponent extends Component {
  onClick = ({
    currentTarget: {
      dataset: { tool }
    }
  }) => {
    this.props.chooseTool(tool);
  };

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     title: '',
  //     file: null,
  //     show: false,
  //     error: ''
  //   };
  // }
  //
  // handleClose = () => {
  //   this.props.editor.options.oldMode = this.props.editor.options.selectMode;
  //   this.props.chooseTool('MOVE_NEW_OBJECT');
  //   this.setState({ show: false });
  // };
  //
  // handleShow = () => {
  //   // debugger;
  //
  //   // console.log(this.props.editor);
  //   // debugger;
  //   this.setState({ show: true });
  // };
  //
  // handleChange = event => {
  //   const name = event.target.name;
  //   if (name === 'file') {
  //     this.setState({
  //       file: event.target.files[0],
  //       error: ''
  //     });
  //   } else {
  //     this.setState({
  //       [name]: event.target.value,
  //       error: ''
  //     });
  //   }
  // };
  //
  // addProject = () => {
  //   const file = this.state.file;
  //   if (!file) {
  //     this.setState({ error: 'Missing project file' });
  //   } else {
  //     this.setState({ error: '' });
  //   }
  //
  //   if (file) {
  //     let fileReader = new FileReader();
  //     let container = document.getElementById('sceneID');
  //     let editor = this.props.editor;
  //     console.log(this.props.editor);
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

  render() {
    const { tool } = this.props;

    return (
      <div id="toolbar">
        <FormattedMessage id="toolbar.point" defaultMessage="Point (v)">
          {value => (
            <button
              className={`btn ${tool === TOOL_POINT ? 'btn-success' : ''}`}
              data-tool={TOOL_POINT}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolPoint} alt="Point" />
            </button>
          )}
        </FormattedMessage>

        <FormattedMessage id="toolbar.select" defaultMessage="Select (m)">
          {value => (
            <button
              className={`btn ${tool === TOOL_SELECT ? 'btn-success' : ''}`}
              data-tool={TOOL_SELECT}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolSelect} alt="Select" />
            </button>
          )}
        </FormattedMessage>

        <button
          className={`btn ${tool === TOOL_MEASUREMENT ? 'btn-success' : ''}`}
          data-tool={TOOL_MEASUREMENT}
          onClick={this.onClick}
          title="Measurement"
        >
          <img src={toolMeasurement} alt="Measurement" />
        </button>

        <FormattedMessage id="toolbar.undo" defaultMessage="Undo">
          {value => (
            <button
              className={`btn ${tool === TOOL_UNDO ? 'btn-success' : ''}`}
              data-tool={TOOL_UNDO}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolUndo} alt="Undo" />
            </button>
          )}
        </FormattedMessage>

        <FormattedMessage id="toolbar.redo" defaultMessage="Redo">
          {value => (
            <button
              className={`btn ${tool === TOOL_REDO ? 'btn-success' : ''}`}
              data-tool={TOOL_REDO}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolRedo} alt="Redo" />
            </button>
          )}
        </FormattedMessage>

        <button
          className={`btn ${tool === TOOL_LINE ? 'btn-success' : ''}`}
          data-tool={TOOL_LINE}
          onClick={this.onClick}
          title="Line"
        >
          <img src={toolLine} alt="Line" />
        </button>

        <FormattedMessage id="toolbar.newCurve" defaultMessage="New curve">
          {value => (
            <button
              className={`btn ${tool === TOOL_NEW_CURVE ? 'btn-success' : ''}`}
              data-tool={TOOL_NEW_CURVE}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolCurve} alt="New curve" />
            </button>
          )}
        </FormattedMessage>

        <FormattedMessage id="toolbar.copy" defaultMessage="Copy / Paste">
          {value => (
            <button
              className={`btn ${tool === TOOL_COPY_PASTE ? 'btn-success' : ''}`}
              data-tool={TOOL_COPY_PASTE}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolCopyPaste} alt="Copy / Paste" />
            </button>
          )}
        </FormattedMessage>

        <FormattedMessage
          id="toolbar.toolBorderRadius"
          defaultMessage="Border Radius"
        >
          {value => (
            <button
              className={`btn ${
                tool === TOOL_BORDER_RADIUS ? 'btn-success' : ''
                }`}
              data-tool={TOOL_BORDER_RADIUS}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolBorderRadius} alt="Border Radius" />
            </button>
          )}
        </FormattedMessage>

        <FormattedMessage id="toolbar.toolFacet" defaultMessage="Facet">
          {value => (
            <button
              className={`btn ${tool === TOOL_FACET ? 'btn-success' : ''}`}
              data-tool={TOOL_FACET}
              onClick={this.onClick}
              title={value}
            >
              <img src={toolFacet} alt="Facet" />
            </button>
          )}
        </FormattedMessage>

        {/*<Modal show={this.state.show} onHide={this.handleClose}>*/}
        {/*<Modal.Header closeButton>*/}
        {/*<FormattedMessage*/}
        {/*id="addElement.modal.title"*/}
        {/*defaultMessage="Add new element"*/}
        {/*>*/}
        {/*{value => <Modal.Title>{value}</Modal.Title>}*/}
        {/*</FormattedMessage>*/}
        {/*</Modal.Header>*/}
        {/*<Modal.Body>*/}
        {/*<Form*/}
        {/*onSubmit={event => {*/}
        {/*event.preventDefault();*/}
        {/*return false;*/}
        {/*}}*/}
        {/*>*/}
        {/*<FormGroup controlId="formControlsFile">*/}
        {/*<FormattedMessage*/}
        {/*id="addProject.modal.fileLabel"*/}
        {/*defaultMessage="File"*/}
        {/*>*/}
        {/*{value => <ControlLabel>{value}</ControlLabel>}*/}
        {/*</FormattedMessage>*/}
        {/*<FormattedMessage*/}
        {/*id="addProject.modal.filePlaceholder"*/}
        {/*defaultMessage="Chose file ..."*/}
        {/*>*/}
        {/*{placeholder => (*/}
        {/*<FormControl*/}
        {/*type="file"*/}
        {/*name="file"*/}
        {/*accept=".dxf"*/}
        {/*placeholder={placeholder}*/}
        {/*onChange={this.handleChange}*/}
        {/*/>*/}
        {/*)}*/}
        {/*</FormattedMessage>*/}
        {/*<HelpBlock>Only *.dxf file supported</HelpBlock>*/}
        {/*<FormControl.Feedback />*/}
        {/*</FormGroup>*/}
        {/*</Form>*/}
        {/*</Modal.Body>*/}

        {/*<Modal.Footer>*/}
        {/*{this.state.error && (*/}
        {/*<HelpBlock className="warning">{this.state.error}</HelpBlock>*/}
        {/*)}*/}
        {/*<FormattedMessage id="addProject.open" defaultMessage="Open">*/}
        {/*{value => <Button onClick={this.addProject}>{value}</Button>}*/}
        {/*</FormattedMessage>*/}
        {/*<FormattedMessage id="btn.cancel" defaultMessage="Close">*/}
        {/*{value => <Button onClick={this.handleClose}>{value}</Button>}*/}
        {/*</FormattedMessage>*/}
        {/*</Modal.Footer>*/}
        {/*</Modal>*/}

        {/* <button className="btn" id="back" type="submit" disabled="true" ng-click="back()" title="Back"><i */}
        {/* class="fa fa-rotate-left"></i></button> */}
        {/* <button className="btn" id="forward" type="submit" disabled="true" ng-click="forward()" title="Forward"><i */}
        {/* class="fa fa-rotate-right"></i></button> */}

        {/* <button className="btn" ng-class="{'btn-success': tools.eraser == editor.tool}" */}
        {/* ng-click="selectTool(tools.eraser)" */}
        {/* title="Erase (e)"><i class="fa fa-trash-o"></i></button> */}

        {/* <!--line--> */}
        {/* <!--arc--> */}
        {/* <!--ruler or measure tool--> */}
        {/* <!--mirror--> */}

        {/* <button className="btn" title="Snapshots"><i class="fa fa-code-fork"></i></button> */}
        {/* <button className="btn" title="Rotate"><i class="fa fa-refresh"></i></button> */}
        {/* <button className="btn" title="Info"><i class="fa fa-info-circle" aria-hidden="true"></i></button> */}

        {/* <button className="btn" title="Object group"><i class="fa fa-object-group" aria-hidden="true"></i></button> */}
        {/* <button className="btn" title="Object ungroup"><i class="fa fa-object-ungroup" aria-hidden="true"></i></button> */}

        {/* <button className="btn" title="Move"><i class="fa fa-hand-paper-o" aria-hidden="true"></i></button> */}
        {/* <button className="btn" title="Zoom"><i class="fa fa-search" aria-hidden="true"></i></button> */}

        {/* <!-- <button className="btn" title="Zoom In"><i class="fa fa-search-plus" aria-hidden="true"></i></button> --> */}
        {/* <!-- <button className="btn" title="Zoom Out"><i class="fa fa-search-minus" aria-hidden="true"></i></i> < /button> --> */}
      </div>
    );
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    editor: PropTypes.shape({
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object,
      isEdit: PropTypes.bool,
      cadCanvas: PropTypes.object
    }),
    chooseTool: PropTypes.func,
    tool: PropTypes.string
  };
}
