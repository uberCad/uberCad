import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './PanelObjects.css';
import sceneService from '../../services/sceneService';
import MaterialComponent from '../Material/materrialComponentContainer';
import Calculate from '../CalculatePrice/calculatePriceComponentContainer';
import AddToBD from '../AddToBD/addElementToDBContainer';
import { FormattedMessage } from 'react-intl';

export default class PanelObjectsComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      currentSnapshot: null,
      objName: ''
    };
  }

  onChangeVisible = ({
    currentTarget: {
      checked,
      dataset: { id }
    }
  }) => {
    const { scene } = this.props.editor;
    if (scene) {
      let layer = scene.getObjectById(parseInt(id, 10));
      this.props.toggleVisible(layer, checked, this.props.editor);
    }
  };

  combineEdgeModels = () => {
    this.props.combineEdgeModels(this.props.editor);
  };

  showAll = () => {
    this.props.showAll(this.props.editor);
  };

  edit = event => {
    event.stopPropagation();
    let {
      currentTarget: {
        dataset: { id }
      }
    } = event;
    const { scene } = this.props.editor;
    if (scene) {
      let object = scene.getObjectById(parseInt(id, 10));
      this.props.isEdit(!this.props.editor.isEdit, this.props.editor, object);
    }
  };

  ungroup = event => {
    event.stopPropagation();
    let {
      currentTarget: {
        dataset: { id }
      }
    } = event;
    const { scene } = this.props.editor;
    if (scene) {
      let object = scene.getObjectById(parseInt(id, 10));
      this.props.ungroup(this.props.editor, object);
    }
  };

  toggleObject = event => {
    const { target, currentTarget } = event;
    const {
      dataset: { id }
    } = currentTarget;

    if (target !== currentTarget) {
      return;
    }

    const { scene } = this.props.editor;
    let object = scene.getObjectById(parseInt(id, 10));
    this.props.toggleObject(
      this.props.editor,
      object !== this.props.activeObject ? object : null
    );
  };

  toggleShow = event => {
    event.stopPropagation();
    let {
      currentTarget: {
        dataset: { id }
      }
    } = event;
    const { scene } = this.props.editor;
    let object = scene.getObjectById(parseInt(id, 10));

    let currentSnapshot = [];
    this.props.snapshots.forEach(item => {
      item.objects.forEach(obj => {
        if (obj.title === object.name) {
          currentSnapshot.push({
            titleSnapshot: item.title,
            objectKey: obj._key
          });
        }
      });
    });
    this.setState({
      show: !this.state.show,
      objName: object.name,
      currentSnapshot
    });
  };

  loadObjectSnapshot = event => {
    event.stopPropagation();
    let confirm;
    if (this.props.isChanged) {
      confirm = window.confirm(
        'Document is not saved. You will lost the changes if you load this snapshot.'
      );
    }
    if (!this.props.isChanged || confirm) {
      let {
        currentTarget: {
          dataset: { key }
        }
      } = event;
      this.props.loadObjectSnapshot(key, this.props.editor.cadCanvas);
    }
    this.setState({
      show: false,
      currentSnapshot: null
    });
  };

  render() {
    const { scene } = this.props.editor;
    let objects;
    if (scene) {
      objects = sceneService.getObjects(scene);
    }

    return (
      <div id="panel-layers">
        <div className="content">
          <div className={`object-snapshot ${this.state.show ? 'show' : ''}`}>
            <h4>{`"${this.state.objName}" snapshots:`}</h4>
            <ul>
              {this.state.currentSnapshot &&
                this.state.currentSnapshot.map((snap, idx) => (
                  <li
                    key={idx}
                    data-key={snap.objectKey}
                    onClick={this.loadObjectSnapshot}
                  >
                    {snap.titleSnapshot}
                  </li>
                ))}
            </ul>
          </div>
          {objects ? (
            objects.children.map((object, idx) => (
              <div
                className={`item ${
                  this.props.activeObject === object ? 'active' : ''
                }`}
                key={idx}
                data-id={object.id}
                onClick={this.toggleObject}
              >
                <FormattedMessage
                  id="panelObject.checkboxVisibility"
                  defaultMessage="Visibility"
                >
                  {value => (
                    <input
                      type="checkbox"
                      data-id={object.id}
                      title={value}
                      checked={object.visible}
                      onChange={this.onChangeVisible}
                    />
                  )}
                </FormattedMessage>

                {object.name}
                <span
                  className="directions"
                  onClick={this.toggleShow}
                  data-id={object.id}
                  title="Load object snapshots"
                />
                <span>{object.children.length}</span>
              </div>
            ))
          ) : (
            <FormattedMessage
              id="panelObject.noObjects"
              defaultMessage="No objects"
            />
          )}
        </div>
        <div className="toolbar">
          {objects && objects.children.length > 1 && (
            <FormattedMessage
              id="panelObject.combineEdgeModels"
              defaultMessage="Combine edge models"
            >
              {value => (
                <button
                  onClick={this.combineEdgeModels}
                  className="combine"
                  title={value}
                />
              )}
            </FormattedMessage>
          )}
          <FormattedMessage id="panelObject.showAll" defaultMessage="Show all">
            {value => (
              <button
                onClick={this.showAll}
                className="show-all"
                title={value}
              />
            )}
          </FormattedMessage>
          {this.props.activeObject && <MaterialComponent />}
          {this.props.activeObject && !this.props.editor.isEdit && (
            <button
              onClick={this.edit}
              data-id={this.props.activeObject.id}
              className="btn-edit"
            />
          )}
          {objects && objects.children.length > 0 && <Calculate />}

          {this.props.activeObject && !this.props.editor.isEdit && (
            <button
              onClick={this.ungroup}
              data-id={this.props.activeObject.id}
              className="btn-ungroup"
            />
          )}

          {this.props.activeObject && <AddToBD />}

        </div>
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

    snapshots: PropTypes.array,

    activeObject: PropTypes.object,
    isChanged: PropTypes.bool,
    objectsIds: PropTypes.array,

    toggleVisible: PropTypes.func,
    combineEdgeModels: PropTypes.func,
    showAll: PropTypes.func,
    isEdit: PropTypes.func,
    toggleObject: PropTypes.func,
    loadObjectSnapshot: PropTypes.func,
    ungroup: PropTypes.func
  };
}
