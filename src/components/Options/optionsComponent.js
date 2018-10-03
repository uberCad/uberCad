import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Options.css'
import {
  TOOL_NEW_CURVE,
  TOOL_POINT,
  TOOL_SELECT,
  TOOL_MEASUREMENT,
  TOOL_LINE,
  TOOL_RECTANGLE,
  TOOL_CHAMFER
} from '../Toolbar/toolbarComponent'
import { FormattedMessage } from 'react-intl'

import Measurement from './Measurement/measurementComponent'
import Line from './Line/lineComponent'
import Rectangle from './Rectangle/rectangleComponent'
import Chamfer from './Chamfer/chamferComponent'

export const SELECT_MODE_NEW = 'SELECT_MODE_NEW'
export const SELECT_MODE_ADD = 'SELECT_MODE_ADD'
export const SELECT_MODE_SUB = 'SELECT_MODE_SUB'
export const SELECT_MODE_INTERSECT = 'SELECT_MODE_INTERSECT'
export const DEFAULT_THRESHOLD = 0.0001

export default class OptionsComponent extends Component {
  onChangeMode = ({currentTarget: {value}}) => {
    this.props.setSelectMode(value)
  }

  onChangeSingleLayer = ({currentTarget: {checked}}) => {
    this.props.setSingleLayerSelect(checked)
  }

  onChangeThreshold = ({currentTarget: {value}}) => {
    this.props.setThreshold(value)
  }

  cancelEdit = () => {
    this.props.cancelEdit(this.props.editor, this.props.editMode.editObject, this.props.editMode.beforeEdit)
  }

  saveEdit = () => {
    this.props.saveEdit(this.props.editor)
  }

  cancelNewLine = () => {
    this.props.cancelNewLine(this.props.editor)
  }

  saveNewLine = () => {
    this.props.saveNewLine(this.props.editor)
  }

  cancelNewCurve = () => {
    this.props.cancelNewCurve(this.props.editor)
  }

  saveNewCurve = () => {
    this.props.saveNewCurve(this.props.editor)
  }

  rotationAngle = (event) => {
    this.props.rotationAngle(event.target.value, this.props.rotationObject, this.props.editor)
  }

  scaleChange = (event) => {
    this.props.scaleChange(event.target.value)
  }

  setScale = () => {
    this.props.setScale(this.props.editMode.scale.scale, this.props.editMode.scale.scaleObject, this.props.editor)

  }

  render () {
    const {
      tool,
      editMode,
      selectMode,
      singleLayerSelect,
      threshold
    } = this.props

    return (
      <div id='options'>
        {(tool === TOOL_POINT || tool === TOOL_SELECT) && (
          <ul className='list-group'>
            <li>
              <FormattedMessage id='options.modeLabel' defaultMessage='Mode'>
                {value => <label>{value}:</label>}
              </FormattedMessage>
              <label>
                <FormattedMessage id='options.inputTitleSelection' defaultMessage='New selection'>
                  {value =>
                    <input type='radio' className='mode-new'
                           title={value}
                           value={SELECT_MODE_NEW}
                           checked={selectMode === SELECT_MODE_NEW}
                           onChange={this.onChangeMode}/>
                  }
                </FormattedMessage>
              </label>
              <label>
                <FormattedMessage id='options.inputTitleAddSelection' defaultMessage='Add to selection (... + Shift)'>
                  {value =>
                    <input type='radio' className='mode-add'
                           title={value}
                           value={SELECT_MODE_ADD}
                           checked={selectMode === SELECT_MODE_ADD}
                           onChange={this.onChangeMode}/>
                  }
                </FormattedMessage>
              </label>
              <label>
                <FormattedMessage id='options.inputTitleSubtract' defaultMessage='Subtract from selection (... + Alt)'>
                  {value =>
                    <input type='radio' className='mode-sub'
                           title={value}
                           value={SELECT_MODE_SUB}
                           checked={selectMode === SELECT_MODE_SUB}
                           onChange={this.onChangeMode}/>
                  }
                </FormattedMessage>
              </label>
              <label>
                <FormattedMessage id='options.inputTitleIntersect'
                                  defaultMessage='Intersect with selection (... + Alt + Shift)'>
                  {value =>
                    <input type='radio' className='mode-intersect'
                           title={value}
                           value={SELECT_MODE_INTERSECT}
                           checked={selectMode === SELECT_MODE_INTERSECT}
                           onChange={this.onChangeMode}/>
                  }
                </FormattedMessage>
              </label>
            </li>
          </ul>
        )}

        {tool === TOOL_POINT && (
          <ul className='list-group'>
            <li>
              <FormattedMessage id='options.inputTitleSameLayer' defaultMessage='Select lines on same layer'>
                {value =>
                  <input type='checkbox' id='editor-options-singleLayerSelect'
                         title={value}
                         defaultChecked={singleLayerSelect}
                         onChange={this.onChangeSingleLayer}/>
                }
              </FormattedMessage>
              <FormattedMessage id='options.labelSameLayer' defaultMessage='Same layer'>
                {value =>
                  <label htmlFor='editor-options-singleLayerSelect'>{value}</label>
                }
              </FormattedMessage>

            </li>
            <li>
              <FormattedMessage id='options.threshold' defaultMessage='Threshold'>
                {value =>
                  <label>
                    {value}
                    <input type='text' min='0.000001' max='0.1' value={threshold}
                           onChange={this.onChangeThreshold}/>
                  </label>
                }
              </FormattedMessage>
            </li>
          </ul>
        )}
        
        {tool === TOOL_NEW_CURVE && (
          <ul className='edit-group'>
            <label>NEW CURVE: </label>
            <button className='save' onClick={this.saveNewCurve}>Save</button>
            <button className='cancel' onClick={this.cancelNewCurve}>Cancel</button>
          </ul>
        )}

        {editMode.isEdit && (
          <ul className='edit-group'>
            <label>Edit Object: </label>

            <div className='tool-info'>
              {editMode.rotation.active && <div>
                <span>Rotation angle: </span>
                <input value={editMode.rotation.angle}
                       onChange={this.rotationAngle}
                       type='number'
                       min='0' max='360'/>
              </div>
              }

              {editMode.scale.active && <div>
                <span>Scale: </span>
                <input value={editMode.scale.scale}
                       onChange={this.scaleChange}
                       type='number'
                       min='0'
                       // max='360'
                />
                <button className='apply' onClick={this.setScale}>setScale</button>
              </div>
              }
            </div>

            <button className='save' onClick={this.saveEdit}>Save</button>
            <button className='cancel' onClick={this.cancelEdit}>Cancel</button>
          </ul>
        )}

        {tool === TOOL_MEASUREMENT &&
        <Measurement
          measurementMode={selectMode}
          setSelectMode={this.props.setSelectMode}
        />}

        {tool === TOOL_LINE &&
        <Line
          lineMode={selectMode}
          setSelectMode={this.props.setSelectMode}
        />}

        {tool === TOOL_CHAMFER &&
        <Chamfer
          options={this.props.chamferOptions}
          mode={selectMode}
          setSelectMode={this.props.setSelectMode}
          inputChange={this.props.inputChange}
        />}

        {tool === TOOL_RECTANGLE &&
        < Rectangle
          rectangleMode={selectMode}
          setSelectMode={this.props.setSelectMode}
        />}

      </div>

    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    tool: PropTypes.string.isRequired,
    editMode: PropTypes.shape({
      isEdit: PropTypes.bool.isRequired
    }),
    editor: PropTypes.object.isRequired,

    selectMode: PropTypes.string.isRequired,
    singleLayerSelect: PropTypes.bool.isRequired,
    threshold: PropTypes.number.isRequired
  }
}
