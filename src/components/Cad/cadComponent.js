import React, { Component } from 'react';
import throttle from 'lodash/throttle';
import PropTypes from 'prop-types';

import api from '../../services/apiService';
import { parseDxf } from '../../services/dxfService';

import Toolbar from '../Toolbar/toolbarComponentContainer';
import Options from '../Options/optionsComponentContainer';
import Sidebar from '../Sidebar/sidebarComponentContainer';
import Selection from '../Selection/selectionComponentContainer';
import PointInfoComponent from '../PointInfo/pointInfoComponentContainer';

import './Cad.css';

export default class CadComponent extends Component {
  constructor(props) {
    super(props);

    this.resizeWindow = throttle(this.resizeWindow, 300);
  }

  //тут парситься файл
  componentDidMount() {
    const { projectId, snapshotId } = this.props.match.params;
    this.props.spinnerShow();
    // if (projectId === 'editObjectElement') {
    // this.props.drawDxf(null, this.container, null);
    // в this.props.drawDxf(null, this.container, null); треба подавати або елемент з БД
    // або загружаємий файл з ПК для створеннм нової сцени і редагування об'єкта
    // todo тут має підгружатись алемент з бібліотеки або загружаємий елемент, важливо!!!
    // }

    api
      .get(
        snapshotId ? `/snapshot/${snapshotId}` : `/project/file/${projectId}`
      )
      .then(data => {
        console.log('_________START_POINT________');
        this.container.id = 'sceneID'; // todo тут костиль
        if (snapshotId) {
          this.props.drawDxf(null, this.container, data);
        } else {
          this.props.drawDxf(parseDxf(data), this.container);
        }
        this.props.spinnerHide();
      })
      .catch(error => {
        console.error(error);
        this.props.spinnerHide();
      });

    window.addEventListener('resize', this.resizeWindow);
    this.props.toggleChanged(this.props.isChanged);
  }

  resizeWindow = () => {
    try {
      this.props.editor.cadCanvas.resize(
        this.container.clientWidth,
        this.container.clientHeigh
      );
    } catch (e) {
      console.error(e, 'CadComponent resize problem');
    }
  };

  componentWillUnmount() {
    // this.stop()
    // if unauthorized user
    if (this.props.editor.renderer) {
      this.container.removeChild(this.props.editor.renderer.domElement);
      window.removeEventListener('resize', this.resizeWindow);
    }
  }

  render() {
    if (this.props.isChanged) {
      window.onbeforeunload = function(evt) {
        const message =
          'Document is not saved. You will lost the changes if you leave the page.';
        if (typeof evt === 'undefined') {
          evt = window.event;
        }
        if (evt) {
          evt.returnValue = message;
        }
        return message;
      };
    } else {
      window.onbeforeunload = null;
    }

    return (
      <div
        className={`threejs-app ${
          this.props.sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'
        }`}
        onMouseUp={this.onMouseUp}
      >
        <div
          className="scene"
          ref={container => {
            this.container = container;
          }}
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
        />
        <Selection />
        <Toolbar />
        <Options />
        <Sidebar />
        <PointInfoComponent />
      </div>
    );
  }

  onClick = event => {
    this.props.onClick(event, this.props.editor);
  };

  onDoubleClick = event => {
    this.props.onDoubleClick(event, this.props.editor);
  };

  onMouseDown = event => {
    this.props.onMouseDown(event, this.props.editor);
  };

  onMouseMove = event => {
    this.props.onMouseMove(event, this.props.editor);
  };

  onMouseUp = event => {
    this.props.onMouseUp(event, this.props.editor);
  };

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    lastUpdated: PropTypes.number,
    isChanged: PropTypes.bool.isRequired,
    editor: PropTypes.object,
    sidebarExpanded: PropTypes.bool,
    project: PropTypes.object,

    fetchProject: PropTypes.func,
    spinnerShow: PropTypes.func,
    spinnerHide: PropTypes.func,
    drawDxf: PropTypes.func,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onMouseDown: PropTypes.func,
    onMouseMove: PropTypes.func,
    onMouseUp: PropTypes.func,
    toggleChanged: PropTypes.func,
    match: PropTypes.shape({
      params: PropTypes.shape({
        projectId: PropTypes.string,
        snapshotId: PropTypes.string
      })
    })
  };
}
