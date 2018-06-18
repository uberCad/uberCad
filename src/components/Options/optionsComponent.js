import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Options.css'
import { TOOL_POINT, TOOL_SELECT } from '../Toolbar/toolbarComponent'
import { FormattedMessage } from 'react-intl'

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
                      onChange={this.onChangeMode} />
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
                      onChange={this.onChangeMode} />
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
                      onChange={this.onChangeMode} />
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
                      onChange={this.onChangeMode} />
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
                    onChange={this.onChangeSingleLayer} />
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
                      onChange={this.onChangeThreshold} />
                  </label>
                }
              </FormattedMessage>
            </li>
          </ul>
        )}

        {editMode.isEdit && (
          <ul className='list-group'>
            <button onClick={this.cancelEdit}>Cancel edit mode</button>
            {/* <li> */}
            {/* <label>Edit object name: {editor.editMode.name}</label> */}
            {/* </li> */}
            {/* <li ng-show="isActivLine() && */}
            {/* editor.editMode.activeLine.geometry.type === 'Geometry' && */}
            {/*! editor.editMode.newLine.active"> */}
            {/* <label htmlFor="x1">x1: <input id="x1" type="number" title="X1:" */}
            {/* ng-model="editor.editMode.lineVertices[0].x" */}
            {/* ng-change="setGeometry(editor.editMode.lineVertices)"></label> */}
            {/* <label htmlFor="y1">y1: <input id="y1" type="number" title="Y1:" */}
            {/* ng-model="editor.editMode.lineVertices[0].y" */}
            {/* ng-change="setGeometry(editor.editMode.lineVertices)"></label> */}
            {/* <label htmlFor="x2">x2: <input id="x2" type="number" title="X2:" */}
            {/* ng-model="editor.editMode.lineVertices[1].x" */}
            {/* ng-change="setGeometry(editor.editMode.lineVertices)"></label> */}
            {/* <label htmlFor="y2">y2: <input id="y2" type="number" title="Y2:" */}
            {/* ng-model="editor.editMode.lineVertices[1].y" */}
            {/* ng-change="setGeometry(editor.editMode.lineVertices)"></label> */}
            {/* </li> */}

            {/* <li ng-show="editor.editMode.newLine.active"> */}
            {/* <label htmlFor="x1-1">x1: <input id="x1-1" type="number" title="X1:" */}
            {/* ng-model="editor.editMode.newLine.point0.x" */}
            {/* ng-keypress="newLinePanel($event)"></label> */}
            {/* <label htmlFor="y1-1">y1: <input id="y1-1" type="number" title="Y1:" */}
            {/* ng-model="editor.editMode.newLine.point0.y" */}
            {/* ng-keypress="newLinePanel($event)"></label> */}
            {/* <label htmlFor="x2-1">x2: <input id="x2-1" type="number" title="X2:" */}
            {/* ng-model="editor.editMode.newLine.point1.x" */}
            {/* ng-keypress="newLinePanel($event)"></label> */}

            {/* <label htmlFor="y2-1">y2: <input id="y2-1" type="number" title="Y2:" */}
            {/* ng-model="editor.editMode.newLine.point1.y" */}
            {/* ng-keypress="newLinePanel($event)"></label> */}
            {/* </li> */}

            {/* <li ng-show="isActivLine() && editor.editMode.activeLine.geometry.type === 'CircleGeometry' "> */}
            {/* <label htmlFor="radius">R: <input id="radius" type="number" title="radius :" */}
            {/* ng-model="editor.editMode.circle.radius" */}
            {/* ng-change="setGeometry(editor.editMode.circle)"></label> */}
            {/* <label htmlFor="positionX">Position X: <input id="positionX" type="number" title="Position X:" */}
            {/* ng-model="editor.editMode.circle.rPosition.x" */}
            {/* ng-change="setGeometry(editor.editMode.circle)"></label> */}
            {/* <label htmlFor="positionY">Position Y: <input id="positionY" type="number" title="Position Y: " */}
            {/* ng-model="editor.editMode.circle.rPosition.y" */}
            {/* ng-change="setGeometry(editor.editMode.circle)"></label> */}
            {/* <label htmlFor="thetaLength">ThetaLength: <input id="thetaLength" type="number" */}
            {/* title="ThetaLength: " */}
            {/* ng-model="editor.editMode.circle.thetaLength" */}
            {/* ng-change="setGeometry(editor.editMode.circle)"></label> */}
            {/* <label htmlFor="thetaStart">ThetaStart: <input id="thetaStart" type="number" title="ThetaStart: " */}
            {/* ng-model="editor.editMode.circle.thetaStart" */}
            {/* ng-change="setGeometry(editor.editMode.circle)"></label> */}
            {/* </li> */}
            {/* <li> */}
            {/* <button ng-click="save()">Save</button> */}
            {/* </li> */}
            {/* <li> */}
            {/* <button ng-click="cancel()">Cancel</button> */}
            {/* </li> */}
            {/* <li> */}
            {/* <button ng-click="deleteLine()" title="Delete line" ng-show="isActivLine()"> */}
            {/* <i className="fa fa-trash-o"></i> */}
            {/* </button> */}
            {/* <button ng-click="newLine()" title="New Line" ng-show="!editor.editMode.newLine.active"> */}
            {/* <i className="fa fa-expand"></i></button> */}
            {/* <button ng-click="cancelNewLine()" className="btn-danger" title="Cancel new Line" */}
            {/* ng-show="editor.editMode.newLine.active"> */}
            {/* <i className="fa fa-expand"></i> */}
            {/* </button> */}
            {/* <button ng-click="newArc()" title="New Arc" ng-show="!editor.editMode.newArc.active"> */}
            {/* <i className="fa fa-dot-circle-o"></i> */}
            {/* </button> */}
            {/* <button ng-click="cancelNewArc()" className="btn-danger" title="Cancel new Arc" */}
            {/* ng-show="editor.editMode.newArc.active"> */}
            {/* <i className="fa fa-dot-circle-o"></i> */}
            {/* </button> */}
            {/* </li> */}
          </ul>
        )}
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
