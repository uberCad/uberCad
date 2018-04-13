import React, { Component } from 'react'
import * as THREE from 'three'
import OrbitControlsLib from 'three-orbit-controls'
import throttle from 'lodash/throttle'
import PropTypes from 'prop-types'
// import './Cad.css'
import Api from '../../services/apiService'
import Dxf from '../../services/dxfService'

const OrbitControls = OrbitControlsLib(THREE)

export default class CadComponent extends Component {
  constructor (props) {
    super(props)

    this.resizeWindow = throttle(this.resizeWindow, 300)
  }

  componentDidMount () {
    const {id} = this.props.match.params
    const {preloadedProject} = this.props

    this.props.spinnerShow()
    Api.get('file.dxf')
      .then(data => {
        this.props.drawDxf(Dxf.parse(data), this.container);
        this.props.spinnerHide()
      })
      .catch(error => {
        console.error(error)
        this.props.spinnerHide()
      })

    // let width = this.container.clientWidth,
    //   height = this.container.clientHeight

    // this.scene = new THREE.Scene()
    // this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)

    // this.renderer = new THREE.WebGLRenderer({antialias: true})
    // let orbit = new OrbitControls(this.camera, this.renderer.domElement)
    // orbit.enableZoom = false
    // orbit.enableKeys = false

    // let geometry = new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1)
    // let material = new THREE.MeshPhongMaterial({
    //   color: 0x156289,
    //   emissive: 0x072534,
    //   side: THREE.DoubleSide,
    //   flatShading: true
    // })
    // let cube = new THREE.Mesh(geometry, material)
    //
    // let lights = [
    //   new THREE.PointLight(0xffffff, 1, 0),
    // ]
    //
    // lights[0].position.set(0, 200, 0)
    //
    // this.scene.add(lights[0])
    //
    // this.camera.position.z = 4
    // this.scene.add(cube)
    // this.renderer.setClearColor(0x000000)
    // this.renderer.setSize(width, height)
    //
    // this.cube = cube
    //
    // this.container.appendChild(this.renderer.domElement)
    this.start()
    window.addEventListener('resize', this.resizeWindow)
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }



  animate = () => {
    // this.props.renderer.render(this.props.scene, this.props.camera)
    // this.frameId = requestAnimationFrame(this.animate)
  }


  resizeWindow = () => {
    let width = this.container.clientWidth,
      height = this.container.clientHeight
    // this.camera.aspect = width / height
    // this.camera.updateProjectionMatrix()
    // this.renderer.setSize(width, height)
    console.log('resizeWindow()')
  }

  componentWillUnmount () {
    // this.stop()
    this.container.removeChild(this.props.renderer.domElement)
    window.removeEventListener('resize', this.resizeWindow)
  }

  render () {
    const {project, loading, error} = this.props

    console.log(/props/, this.props);

    return (
      <div className='threejs-app'>
        {this.props.camera ? 'true' : 'false'}
        {/*<h1>Project:</h1>*/}
        {/*{JSON.stringify(project)}*/}
        {/*<p>Loading {loading ? 'true': 'false'}</p>*/}
        {/*<p>Error {error ? 'true': 'false'}</p>*/}
        <div className='scene' ref={container => this.container = container}/>
        {/*<div className='panel'>*/}
        {/*<input name='dx' type="range" min="-0.03" max="0.03" step={0.01} value={this.state.dx} onChange={this.updateDelta} />*/}
        {/*<input name='dy' type="range" min="-0.03" max="0.03" step={0.01} value={this.state.dy} onChange={this.updateDelta} />*/}
        {/*<input name='dz' type="range" min="-0.03" max="0.03" step={0.01} value={this.state.dz} onChange={this.updateDelta} />*/}
        {/*</div>*/}
      </div>
    )
  }

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    lastUpdated: PropTypes.number
  }
}