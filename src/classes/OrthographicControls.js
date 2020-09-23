import * as THREE from '../extend/THREE';
import { EventDispatcher } from 'three';

export class OrthographicControls extends EventDispatcher {
  #camera = null;
  #container = null;
  #state = 0;

  #ratioX = 0;
  #ratioY = 0;
  #changeEvent = { type: 'change' };

  STATE = {
    NONE: 0,
    PAN: 1,
    DOLLY: 2
  };

  constructor(camera, container) {
    super();
    this.#camera = camera;
    this.#container = container;

    // + right pan
    // + wheel dolly over cursor center
    //touch pan
    //double touch pan and dolly
    // controls.touches.ONE = THREE.TOUCH.PAN;
    // controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

    //bind this for event listeners
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.init();
  }

  init() {
    this.#container.addEventListener('mousedown', this.onMouseDown, false);
    this.#container.addEventListener('wheel', this.onMouseWheel, false);
    this.#container.addEventListener('contextmenu', this.onContextMenu, false);
  }

  onMouseWheel(event) {
    event.preventDefault();
    this.handleMouseWheel(event);
  }

  onMouseDown(event) {
    event.preventDefault();

    switch (event.button) {
      // left
      case 0:
        break;

      // middle
      case 1:
        break;

      // right
      case 2:
        // event.preventDefault();
        this.handleMouseDownPan(event);
        this.#state = this.STATE.PAN;
        break;
      default:
        break;
    }

    document.addEventListener('mousemove', this.onMouseMove, false);
    document.addEventListener('mouseup', this.onMouseUp, false);
  }

  onMouseMove(event) {
    switch (this.#state) {
      case this.STATE.NONE:
        console.warn('Unexpected event. STATE.NONE');
        break;

      case this.STATE.PAN:
        this.handleMouseMovePan(event);
        break;
      default:
        break;
    }
  }

  onMouseUp() {
    document.removeEventListener('mousemove', this.onMouseMove, false);
    document.removeEventListener('mouseup', this.onMouseUp, false);
    this.#state = this.STATE.NONE;
  }

  onContextMenu(event) {
    event.preventDefault();
  }

  handleMouseMovePan(event) {
    //get mouse dx, dy
    //calculate ratio between mouse move (dx, dy) and camera view (top, left, bottom, right)
    //move camera view according to calculation

    const { movementX, movementY } = event;
    this.#camera.position.x += movementX * this.#ratioX;
    this.#camera.position.y += movementY * this.#ratioY;

    this.#camera.updateProjectionMatrix();
    this.#camera.needUpdate = true;

    this.dispatchEvent(this.#changeEvent);
  }

  handleMouseDownPan(event) {
    this.#ratioX =
      (this.#camera.left - this.#camera.right) / event.target.width;
    this.#ratioY =
      (this.#camera.top - this.#camera.bottom) / event.target.height;

    // panStart.set( event.clientX, event.clientY );
  }

  handleMouseWheel(event) {
    const dollyScale = 0.95;

    let scale = dollyScale;
    if (event.deltaY > 0) {
      scale = 1 / dollyScale;
    }

    const { offsetX, offsetY } = event;
    let mouse = new THREE.Vector3(
      (offsetX / (event.target.width - 2)) * 2 - 1,
      -(offsetY / (event.target.height - 2)) * 2 + 1,
      0
    );
    mouse.unproject(this.#camera);

    const { position } = this.#camera;
    position.x -= (position.x - mouse.x) * (1 - scale);
    position.y -= (position.y - mouse.y) * (1 - scale);

    this.#camera.left = this.#camera.left * scale;
    this.#camera.right = this.#camera.right * scale;
    this.#camera.top = this.#camera.top * scale;
    this.#camera.bottom = this.#camera.bottom * scale;

    this.#camera.needUpdate = true;
    this.#camera.updateProjectionMatrix();
    this.dispatchEvent(this.#changeEvent);
  }
}
