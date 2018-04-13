uberCad
=======

Run `yarn start`

To check codestyle

#### create-react-app 

    npx create-react-app client
	

#### create router

    yarn add react-router-dom

wrap `<App />` with `<HashRouter>`

create nav-bar with Link: Home, Demo 

create routes, wrapped with `<Switch>`
	
	<Switch>
	    <Route path='/' exact render={() => 'home'} ..or.. component={Home} />
    </Switch>


#### create empty components for Home and Demo

    also let router use this components


#### create simple server

move to parent dir

    yarn init
	yarn add express
	yarn add nodemon --dev

create file `index.js`

    const express = require('express');
    const path = require('path');

    const app = express(),
        http = require('http').Server(app),
        port = process.env.PORT || 5000;

    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, 'client/build')));

    // Put all ApiService endpoints under '/api'
    app.get('/api/data', (req, res) => {
        res.json({users: [
            {username: 'John', id: 251},
            {username: 'Jane', id: 904}
        ]});
        console.log(`request /api/data`);
    });

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname+'/client/build/index.html'));
    });

    http.listen(port, function () {
        console.log(`Server running at localhost:${port}`);
    });

add scripts to package.json

    "scripts": {
        "start": "node index.js",
        "heroku-postbuild": "cd client && yarn --production=false && yarn run build"
    }

run `yarn start` (for server)

add proxy to react's package.json:
		
    "proxy": "http://localhost:5000"

run `yarn start` (for client-react)


#### add fetch('/api/data') to Home-component

    componentDidMount() {
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                this.setState({
                    users: data.users
                })
            })
    }
        
render users list to demonstrate response from server


#### add three.js

	yarn add three three-orbit-controls

update file Demo.js

    import React, {Component} from 'react'
    import * as THREE from 'three'
    import OrbitControlsLib from 'three-orbit-controls'
    import './Demo.css'

    const OrbitControls = OrbitControlsLib(THREE);

    export default class Demo extends Component {
        constructor(props) {
            super(props);
        }

        componentDidMount() {
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
        }

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

        componentWillUnmount() {
            this.stop();
            this.container.removeChild(this.renderer.domElement);
        }

        render() {
            return (
                <div className='threejs-app'>
                    <div className='scene' ref={container => this.container = container}/>
                </div>
            )
        }
    }

create file Demo.css

    .threejs-app .scene {
        width: 100%;
        height: calc(100% - 190px);
        display: block;
        position: absolute;
        left: 0;
        top: 190px;
        overflow: hidden;
    }


#### add control panel

delta for every axis with `<input type='range' />` 


#### fix problem with resize window

set canvas size and fix camera aspect


#### add throttling

try to do that with throttle and debounce


#### add socket.io to server

send welcome event on connection


#### add socket.io to client

receive welcome event 


#### demonstration reason to removeListener at componentWillUnmount()

navigate Home <-> Demo, couple times


#### broadcast delta update trough the socket

try this with multiple windows


#### broadcast camera position trough the socket

say couple words about camera and orbitControls


#### deploy to heroku

    heroru login
    heroku git:remote -a react-three-socket
    git push heroku master
    heroku open

https://react-three-socket.herokuapp.com/


## Useful links

- https://daveceddia.com/create-react-app-express-backend/
- https://daveceddia.com/create-react-app-express-production/