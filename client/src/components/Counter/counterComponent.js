import React, {Component} from 'react'
import DxfParser from 'dxf-parser'
// import ThreeDxf from 'three-dxf'
import throttle from "lodash/throttle";
import * as THREE from 'three'
import OrbitControlsLib from 'three-orbit-controls'

const OrbitControls = OrbitControlsLib(THREE);


export default class CounterComponent extends Component {

    constructor(props) {
        super(props);

        this.dxf = null;

        this.resizeWindow = throttle(this.resizeWindow, 300);
    }

    componentDidMount() {
        // console.log('componentDidMount() props in component', this.props);


        let width = this.container.clientWidth,
            height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        let orbit = new OrbitControls(this.camera, this.renderer.domElement);
        orbit.enableZoom = false;
        orbit.enableKeys = false;

        let geometry = new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1);
        let material = new THREE.MeshPhongMaterial({
            color: 0x156289,
            emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: true
        });
        let cube = new THREE.Mesh(geometry, material);

        let lights = [
            new THREE.PointLight( 0xffffff, 1, 0 ),
            new THREE.PointLight( 0xffffff, 1, 0 ),
            new THREE.PointLight( 0xffffff, 1, 0 )
        ];

        lights[ 0 ].position.set( 0, 200, 0 );
        lights[ 1 ].position.set( 100, 200, 100 );
        lights[ 2 ].position.set( - 100, - 200, - 100 );

        this.scene.add(lights[0]);
        this.scene.add(lights[1]);
        this.scene.add(lights[2]);

        this.camera.position.z = 4;
        this.scene.add(cube);
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(width, height);

        this.cube = cube;

        this.container.appendChild(this.renderer.domElement);
        this.start();
        // window.addEventListener("resize", this.resizeWindow);





        fetch('/api/file.dxf')
            .then(req => req.text())
            .then(data => {
                // console.log(data.length);


                let parser = new DxfParser();
                try {
                    this.dxf = parser.parseSync(data);
                    // let cadCanvas = new ThreeDxf.Viewer(this.dxf, document.getElementById('cad-view'), 400, 400);


                    // console.log(data.length, parser);


                } catch (e) {

                }

            })
    };



    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    };

    stop = () => {
        cancelAnimationFrame(this.animate);
    };

    animate = () => {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.02;

        this.renderScene();
        this.frameId = requestAnimationFrame(this.animate);
    };

    renderScene = () => {
        this.renderer.render(this.scene, this.camera);
    };

    resizeWindow = () => {
        let width = this.container.clientWidth,
            height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        // console.log('resizeWindow()');
    };

    componentWillUnmount() {
        this.stop();
        this.container.removeChild(this.renderer.domElement);
        window.removeEventListener("resize", this.resizeWindow);
    }

    render() {
        // console.log('HeaderComponent: render()', this.dxf)

        return (
            <div>
                <h3>Counter component</h3>
                {/*<input type='text' value={this.props.count} onChange={this.changeName} />*/}
                <button onClick={() =>this.props.incrementCount(1)}>+</button>
                {this.props.count}
                <button onClick={() => this.props.decrementCount()}>-</button>

                <div className='threejs-app'>
                    <canvas id='cad-view' />
                    <div className='scene' ref={container => this.container = container}/>
                </div>
            </div>

        )
    }
}