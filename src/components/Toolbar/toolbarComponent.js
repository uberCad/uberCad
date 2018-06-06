// ICONS: https://www.flaticon.com/free-icon/computer-mouse-cursor_70358#term=cursor&page=1&position=11

import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import './Toolbar.css'
import toolPoint from './point.svg'
import toolSelect from './select.svg'
import toolUndo from './undo.svg'
import toolRedo from './redo.svg'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'

export const TOOL_POINT = 'TOOL_POINT'
export const TOOL_SELECT = 'TOOL_SELECT'
export const TOOL_UNDO = 'TOOL_UNDO'
export const TOOL_REDO = 'TOOL_REDO'

export default class ToolbarComponent extends Component {
  onClick = ({currentTarget: {dataset: {tool}}}) => {
    this.props.chooseTool(tool)
  }

  render () {
    const {tool} = this.props

    return (
      <div id='toolbar'>
        <FormattedMessage id='toolbar.point' defaultMessage='Point (v)'>
          {value =>
            <button className={`btn ${tool === TOOL_POINT ? 'btn-success' : ''}`}
                    data-tool={TOOL_POINT}
                    onClick={this.onClick}
                    title={value}
            >
              <img src={toolPoint} alt='Point'/>
            </button>
          }
        </FormattedMessage>

        <FormattedMessage id='toolbar.select' defaultMessage='Select (m)'>
          {value =>
            <button className={`btn ${tool === TOOL_SELECT ? 'btn-success' : ''}`}
                    data-tool={TOOL_SELECT}
                    onClick={this.onClick}
                    title={value}
            >
              <img src={toolSelect} alt='Select'/>
            </button>
          }
        </FormattedMessage>

        <FormattedMessage id='toolbar.undo' defaultMessage='Undo'>
          {value =>
            <button className={`btn ${tool === TOOL_UNDO ? 'btn-success' : ''}`}
                    data-tool={TOOL_UNDO}
                    onClick={this.onClick}
                    title={value}
            >
              <img src={toolUndo} alt='Undo'/>
            </button>
          }
        </FormattedMessage>

        <FormattedMessage id='toolbar.redo' defaultMessage='Redo'>
          {value =>
            <button className={`btn ${tool === TOOL_REDO ? 'btn-success' : ''}`}
                    data-tool={TOOL_REDO}
                    onClick={this.onClick}
                    title={value}
            >
              <img src={toolRedo} alt='Redo'/>
            </button>
          }
        </FormattedMessage>

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

    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired
    // tool: PropTypes.object.isRequired,
  }
}
