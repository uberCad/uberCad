import React, { Component } from 'react'
import throttle from 'lodash/throttle'
import PropTypes from 'prop-types'
import Api from '../../services/apiService'
import Dxf from '../../services/dxfService'
import Toolbar from '../Toolbar/toolbarComponentContainer'
// import * as THREE  from '../../extend/THREE'

import './Cad.css'

export default class CadComponent extends Component {
  constructor (props) {
    super(props)

    this.resizeWindow = throttle(this.resizeWindow, 300)
  }

  componentDidMount () {
    // const {id} = this.props.match.params
    // const {preloadedProject} = this.props

    this.props.spinnerShow()
    Api.get('file.dxf')
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
    let width = this.container.clientWidth,
      height = this.container.clientHeight
    this.props.cadCanvas.resize(width, height);

  }

  componentWillUnmount () {
    // this.stop()
    this.container.removeChild(this.props.renderer.domElement)
    window.removeEventListener('resize', this.resizeWindow)
  }

  render () {
    // const {project, loading, error} = this.props

    // console.log(/props/, this.props)

    return (
      <div className='threejs-app'>
        <div className='scene'
             ref={container => this.container = container}
             onClick={this.onClick}
        />
        <Toolbar />
      </div>
    )
  }

  onClick = (event) => {
    
    this.props.onClick(event, this.props.editor)
  }

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    lastUpdated: PropTypes.number
  }
}