import React, { Component } from 'react'
import throttle from 'lodash/throttle'
import PropTypes from 'prop-types'
import Api from '../../services/apiService'
import Dxf from '../../services/dxfService'
import Toolbar from '../Toolbar/toolbarComponentContainer'
import Options from '../Options/optionsComponentContainer'
import Sidebar from '../Sidebar/sidebarComponentContainer'
import Selection from '../Selection/selectionComponentContainer'
// import * as THREE  from '../../extend/THREE'

import './Cad.css'

export default class CadComponent extends Component {
  constructor (props) {
    super(props)

    this.resizeWindow = throttle(this.resizeWindow, 300)
  }

  componentDidMount () {
    const {id} = this.props.match.params
    // const {preloadedProject} = this.props

    this.props.spinnerShow()
    // Api.get('file.dxf')
    Api.get(`project-file/${id}`)
      .then(data => {
        this.props.drawDxf(Dxf.parse(data), this.container)
        this.props.spinnerHide()
      })
      .catch(error => {
        console.error(error)
        this.props.spinnerHide()
      })

    window.addEventListener('resize', this.resizeWindow)
  }

  resizeWindow = () => {
    let width = this.container.clientWidth
    let height = this.container.clientHeight

    try {
      this.props.editor.cadCanvas.resize(width, height)
    } catch (e) {}
  }

  componentWillUnmount () {
    // this.stop()
    this.container.removeChild(this.props.editor.renderer.domElement)
    window.removeEventListener('resize', this.resizeWindow)
  }

  render () {
    return (
      <div className={`threejs-app ${this.props.sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        onMouseUp={this.onMouseUp}
      >
        <div className='scene'
          ref={container => { this.container = container }}
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}

        />
        <Selection />
        <Toolbar />
        <Options />
        <Sidebar />
      </div>
    )
  }

  onClick = (event) => {
    this.props.onClick(event, this.props.editor)
  }

  onDoubleClick = (event) => {
    this.props.onDoubleClick(event, this.props.editor)
  }

  onMouseDown = (event) => {
    this.props.onMouseDown(event, this.props.editor)
  }

  onMouseMove = (event) => {
    this.props.onMouseMove(event, this.props.editor)
  }

  onMouseUp = (event) => {
    this.props.onMouseUp(event, this.props.editor)
  }

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    lastUpdated: PropTypes.number
  }
}
