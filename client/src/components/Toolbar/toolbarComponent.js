import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import './Toolbar.css'

export const TOOL_POINT = 'TOOL_POINT';
export const TOOL_SELECT = 'TOOL_SELECT';

export default class ToolbarComponent extends Component {
  onClick = ({target: {dataset: {tool}}}) => {
    // console.log('target', tool)
    this.props.chooseTool(tool)
  }

  render () {
    const {tool} = this.props

    return (
      <div id='toolbar'>
        <button className={`btn ${tool === TOOL_POINT ? 'btn-success' : ''}`}
                data-tool={TOOL_POINT}
                onClick={this.onClick}
                title="Point (v)"
        >
          <i className="fa fa-mouse-pointer" />
        </button>

        <button className={`btn ${tool === TOOL_SELECT ? 'btn-success' : ''}`}
                data-tool={TOOL_SELECT}
                onClick={this.onClick}
                title="Select (m)"
        >
          <i className="fa fa-clone" />
        </button>



        {/*<button className="btn" ng-class="{'btn-success': tools.eraser == editor.tool}"*/}
                {/*ng-click="selectTool(tools.eraser)"*/}
                {/*title="Erase (e)"><i class="fa fa-trash-o"></i></button>*/}
        {/*<button className="btn" id="back" type="submit" disabled="true" ng-click="back()" title="Back"><i*/}
          {/*class="fa fa-rotate-left"></i></button>*/}
        {/*<button className="btn" id="forward" type="submit" disabled="true" ng-click="forward()" title="Forward"><i*/}
          {/*class="fa fa-rotate-right"></i></button>*/}

        {/*<!--line-->*/}
        {/*<!--arc-->*/}
        {/*<!--ruler or measure tool-->*/}
        {/*<!--mirror-->*/}

        {/*<button className="btn" title="Snapshots"><i class="fa fa-code-fork"></i></button>*/}
        {/*<button className="btn" title="Rotate"><i class="fa fa-refresh"></i></button>*/}
        {/*<button className="btn" title="Info"><i class="fa fa-info-circle" aria-hidden="true"></i></button>*/}

        {/*<button className="btn" title="Object group"><i class="fa fa-object-group" aria-hidden="true"></i></button>*/}
        {/*<button className="btn" title="Object ungroup"><i class="fa fa-object-ungroup" aria-hidden="true"></i></button>*/}

        {/*<button className="btn" title="Move"><i class="fa fa-hand-paper-o" aria-hidden="true"></i></button>*/}
        {/*<button className="btn" title="Zoom"><i class="fa fa-search" aria-hidden="true"></i></button>*/}

        {/*<!-- <button className="btn" title="Zoom In"><i class="fa fa-search-plus" aria-hidden="true"></i></button> -->*/}
        {/*<!-- <button className="btn" title="Zoom Out"><i class="fa fa-search-minus" aria-hidden="true"></i></i> < /button> -->*/}
      </div>

    )

  }

  static propTypes = {
    // tool: PropTypes.object.isRequired,
  }
}