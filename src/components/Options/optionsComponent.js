import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Options.css';
import {
  TOOL_NEW_CURVE,
  TOOL_POINT,
  TOOL_SELECT,
  TOOL_MEASUREMENT,
  TOOL_LINE,
  TOOL_COPY_PASTE
} from '../Toolbar/toolbarComponent';
import { FormattedMessage } from 'react-intl';

import Measurement from './Measurement/measurementComponent';
import Line from './Line/lineComponent';
// import FormattedInput from '../atoms/formatted-input';

import { SelectNewTypes } from '../../store/options/types';

// const inputs = [
//   {
//     id: 'mode-new',
//     type: 'radio',
//     value: SelectNewTypes.NEW,
//     formattedMessageId: 'options.inputTitleSelection',
//     message: 'New selection',
//     theme: {
//       backgroundPosition: '-4px -2px',
//       width: '22px',
//       height: '22px'
//     }
//   },
//   {
//     id: 'mode-add',
//     type: 'radio',
//     value: SelectNewTypes.ADD,
//     formattedMessageId: 'options.inputTitleAddSelection',
//     message: 'Add to selection (... + Shift)',
//     theme: {
//       backgroundPosition: '-27px -2px',
//       width: '22px',
//       height: '22px'
//     }
//   },
//   {
//     id: 'mode-sub',
//     type: 'radio',
//     value: SelectNewTypes.SUB,
//     formattedMessageId: 'options.inputTitleSubtract',
//     message: 'Subtract from selection (... + Alt)',
//     theme: {
//       backgroundPosition: '-51px -2px',
//       width: '22px',
//       height: '22px'
//     }
//   },
//   {
//     id: 'mode-intersect',
//     type: 'radio',
//     value: SelectNewTypes.INTERSECT,
//     formattedMessageId: 'options.inputTitleIntersect',
//     message: 'Intersect with selection (... + Alt + Shift)',
//     theme: {
//       backgroundPosition: '-75px -2px',
//       width: '22px',
//       height: '22px'
//     }
//   }
// ];

const images = {
  undo: require('../../assets/images/redo.svg'),
  redo: require('../../assets/images/redo.svg')
};

export default class OptionsComponent extends Component {
  onChangeMode = ({ currentTarget: { value } }) => {
    this.props.setSelectMode(value);
  };

  onChangeSingleLayer = ({ currentTarget: { checked } }) => {
    this.props.setSingleLayerSelect(checked);
  };

  onChangeThreshold = ({ currentTarget: { value } }) => {
    this.props.setThreshold(value);
  };

  cancelEdit = () => {
    this.props.cancelEdit(
      this.props.editor,
      this.props.editMode.editObject,
      this.props.editMode.beforeEdit
    );
  };

  saveEdit = () => {
    this.props.saveEdit(this.props.editor);
  };

  saveSnap = () => {
    const href = window.location.href;
    let snapPosInHref = null;
    for (let i = 0; i < href.length - 1; i++) {
      if (href[i] === '/') {
        snapPosInHref = i;
      }
    }
    let snapNum = '';
    for (let i = snapPosInHref; i < href.length; i++) {
      if (href[i] !== '/') {
        snapNum += href[i];
      }
    }
    let title = '';
    let snapshots = this.props.project.snapshots;
    for (let i = 0; i < snapshots.length; i++) {
      if (snapshots[i]._key === snapNum) {
        title = snapshots[i].title;
      }
    }
    if (title === '') {
      title = 'Snapshot';
    } else if (
      title.length > 17 &&
      title[title.length - 3] === ':' &&
      title[title.length - 6] === ' ' &&
      title[title.length - 9] === '/' &&
      title[title.length - 12] === '/' &&
      title[title.length - 15] === '0' &&
      title[title.length - 16] === '2' &&
      title[title.length - 17] === ' '
    ) {
      const titleWithDate = '' + title;
      title = '';
      for (let i = 0; i < titleWithDate.length - 17; i++) {
        title += titleWithDate[i];
      }
    }
    const data = new Date();
    const year = data.getFullYear();
    const month =
      1 + data.getMonth() > 9
        ? 1 + data.getMonth()
        : '0' + (1 + data.getMonth());
    const date = data.getDate() > 9 ? data.getDate() : '0' + data.getDate();
    const hours = data.getHours() > 9 ? data.getHours() : '0' + data.getHours();
    const minutes =
      data.getMinutes() > 9 ? data.getMinutes() : '0' + data.getMinutes();
    const snapshot = {
      title: `${title} ${year}/${month}/${date} ${hours}:${minutes}`,
      scene: this.props.scene
    };
    this.props.saveSnap(snapshot, this.props.project._key, true);
  };

  cancelNewLine = () => {
    this.props.cancelNewLine(this.props.editor);
  };

  saveNewLine = () => {
    this.props.saveNewLine(this.props.editor);
  };

  cancelNewCurve = () => {
    this.props.cancelNewCurve(this.props.editor);
  };

  saveNewCurve = () => {
    this.props.saveNewCurve(this.props.editor);
  };

  rotationAngle = event => {
    this.props.rotationAngle(
      event.target.value,
      this.props.rotationObject,
      this.props.editor
    );
  };

  scaleChange = event => {
    this.props.scaleChange(event.target.value);
  };

  setScale = () => {
    this.props.setScale(
      this.props.editMode.scale.scale,
      this.props.editMode.scale.scaleObject,
      this.props.editor
    );
  };

  copy = event => {
    // todo розкомітити строку нижче якщо потрібний копіювати і через клік по сцені
    // this.props.setSelectMode("COPY");
    this.props.copyClick(this.props.editor, event);
  };

  paste = event => {
    // this.props.setSelectMode("PASTE");
    this.props.pasteClick(this.props.editor, event);
  };

  render() {
    const {
      tool,
      editMode,
      selectMode,
      singleLayerSelect,
      threshold
    } = this.props;
    const { renderer, camera } = this.props.editor;

    return (
      <div id="options">
        <button className="save-snap" onClick={this.saveSnap}>
          Save snapshot
        </button>
        <div className="undo-redo-container">
          <img
            className="img undo"
            src={images.undo}
            alt="undo"
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              this.props.undo(renderer, camera);
            }}
          />
          <img
            className="img"
            src={images.redo}
            alt="redo"
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              this.props.redo(renderer, camera);
            }}
          />
        </div>
        {(tool === TOOL_POINT || tool === TOOL_SELECT) && (
          <ul className="list-group">
            <li>
              <FormattedMessage id="options.modeLabel" defaultMessage="Mode">
                {value => <label>{value}:</label>}
              </FormattedMessage>
              {/* {inputs.map(input => {
                return (value => (
                  <FormattedInput
                    id={input.id}
                    type={input.type}
                    title={value}
                    value={input.value}
                    checked={selectMode === input.value}
                    formattedMessageId={input.formattedMessageId}
                    defaultMessage={input.defaultMessage}
                    onChange={this.onChangeMode}
                  />
                ))();
              })} */}
              <label>
                <FormattedMessage
                  id="options.inputTitleSelection"
                  defaultMessage="New selection"
                >
                  {value => (
                    <input
                      type="radio"
                      className="mode-new"
                      title={value}
                      value={SelectNewTypes.NEW}
                      checked={selectMode === SelectNewTypes.NEW}
                      onChange={this.onChangeMode}
                    />
                  )}
                </FormattedMessage>
              </label>
              <label>
                <FormattedMessage
                  id="options.inputTitleAddSelection"
                  defaultMessage="Add to selection (... + Shift)"
                >
                  {value => (
                    <input
                      type="radio"
                      className="mode-add"
                      title={value}
                      value={SelectNewTypes.ADD}
                      checked={selectMode === SelectNewTypes.ADD}
                      onChange={this.onChangeMode}
                    />
                  )}
                </FormattedMessage>
              </label>
              <label>
                <FormattedMessage
                  id="options.inputTitleSubtract"
                  defaultMessage="Subtract from selection (... + Alt)"
                >
                  {value => (
                    <input
                      className="mode-sub"
                      type="radio"
                      title={value}
                      value={SelectNewTypes.SUB}
                      checked={selectMode === SelectNewTypes.SUB}
                      onChange={this.onChangeMode}
                    />
                  )}
                </FormattedMessage>
              </label>
              <label>
                <FormattedMessage
                  id="options.inputTitleIntersect"
                  defaultMessage="Intersect with selection (... + Alt + Shift)"
                >
                  {value => (
                    <input
                      type="radio"
                      className="mode-intersect"
                      title={value}
                      value={SelectNewTypes.INTERSECT}
                      checked={selectMode === SelectNewTypes.INTERSECT}
                      onChange={this.onChangeMode}
                    />
                  )}
                </FormattedMessage>
              </label>
            </li>
          </ul>
        )}

        {tool === TOOL_POINT && (
          <ul className="list-group">
            <li>
              <FormattedMessage
                id="options.inputTitleSameLayer"
                defaultMessage="Select lines on same layer"
              >
                {value => (
                  <input
                    type="checkbox"
                    id="editor-options-singleLayerSelect"
                    title={value}
                    defaultChecked={singleLayerSelect}
                    onChange={this.onChangeSingleLayer}
                  />
                )}
              </FormattedMessage>
              <FormattedMessage
                id="options.labelSameLayer"
                defaultMessage="Same layer"
              >
                {value => (
                  <label htmlFor="editor-options-singleLayerSelect">
                    {value}
                  </label>
                )}
              </FormattedMessage>
            </li>
            <li>
              <FormattedMessage
                id="options.threshold"
                defaultMessage="Threshold"
              >
                {value => (
                  <label>
                    {value}
                    <input
                      type="text"
                      min="0.000001"
                      max="0.1"
                      value={threshold}
                      onChange={this.onChangeThreshold}
                    />
                  </label>
                )}
              </FormattedMessage>
            </li>
          </ul>
        )}

        {tool === TOOL_NEW_CURVE && (
          <ul className="edit-group">
            <label>NEW CURVE: </label>
            <button className="save" onClick={this.saveNewCurve}>
              Save
            </button>
            <button className="cancel" onClick={this.cancelNewCurve}>
              Cancel
            </button>
          </ul>
        )}

        {editMode.isEdit && (
          <ul className="edit-group">
            <label>Edit Object: </label>

            <div className="tool-info">
              {editMode.rotation.active && (
                <div>
                  <span>Rotation angle: </span>
                  <input
                    value={editMode.rotation.angle}
                    onChange={this.rotationAngle}
                    type="number"
                    min="0"
                    max="360"
                  />
                </div>
              )}

              {editMode.scale.active && (
                <div>
                  <span>Scale: </span>
                  <input
                    value={editMode.scale.scale}
                    onChange={this.scaleChange}
                    type="number"
                    min="0"
                    // max='360'
                  />
                  <button className="apply" onClick={this.setScale}>
                    setScale
                  </button>
                </div>
              )}
            </div>

            <button className="save" onClick={this.saveEdit}>
              Save
            </button>
            <button className="cancel" onClick={this.cancelEdit}>
              Cancel
            </button>
          </ul>
        )}

        {tool === TOOL_MEASUREMENT && selectMode && (
          <Measurement
            measurementMode={selectMode}
            setSelectMode={this.props.setSelectMode}
          />
        )}
        {tool === TOOL_LINE && selectMode && (
          <Line
            lineMode={selectMode}
            measurementMode={selectMode}
            setSelectMode={this.props.setSelectMode}
          />
        )}

        {tool === TOOL_COPY_PASTE && (
          <ul className="edit-group">
            <label>Copy / Paste: </label>
            <button className="Copy" onClick={this.copy}>
              Copy
            </button>
            <button className="Paste" onClick={this.paste}>
              Paste
            </button>
          </ul>
        )}
      </div>
    );
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    tool: PropTypes.string.isRequired,
    editMode: PropTypes.object,
    editor: PropTypes.object.isRequired,
    project: PropTypes.object.isRequired,

    selectMode: PropTypes.string.isRequired,
    singleLayerSelect: PropTypes.bool.isRequired,
    threshold: PropTypes.number.isRequired,
    scene: PropTypes.object,
    rotationObject: PropTypes.object,
    setSelectMode: PropTypes.func,
    setSingleLayerSelect: PropTypes.func,
    setThreshold: PropTypes.func,
    cancelEdit: PropTypes.func,
    saveEdit: PropTypes.func,
    cancelNewLine: PropTypes.func,
    saveNewLine: PropTypes.func,
    cancelNewCurve: PropTypes.func,
    saveNewCurve: PropTypes.func,
    rotationAngle: PropTypes.func,
    scaleChange: PropTypes.func,
    setScale: PropTypes.func,
    copyClick: PropTypes.func,
    pasteClick: PropTypes.func,
    saveSnap: PropTypes.func,
    undo: PropTypes.func,
    redo: PropTypes.func
  };
}
