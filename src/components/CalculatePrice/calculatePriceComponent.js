import React, { Component } from 'react'
import PropTypes from 'prop-types'
import consoleUtils from '../../services/consoleUtils'
import { Button, Modal, ListGroup } from 'react-bootstrap'
import './CalculatePrice.css'

export default class CalculatePriceComponent extends Component {

  calculate = () => {
    this.props.calculate(this.props.scene)
  }

  render () {
    const {polyamides} = this.props
    const objects = this.props.scene.children[1].children
    let systemWeight = 0
    objects.map((object) => {
      if (object.userData.info) return (systemWeight += object.userData.info.weight)
    })

    return (
      <div>
        <button onClick={this.calculate} title='Calculate price' className='btn-calc'/>
        {this.props.show &&
        <Modal show={this.props.show} onHide={this.props.calculateHide} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Polyamide</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ListGroup componentClass='ul' className='polyamide-list'>
              {polyamides.length &&
              polyamides.map((object, i) => {
                  return (
                    <li className="list-group-flush" key={i}>
                      <h4>Object: {object.name}</h4>
                      <h3>Material: {object.userData.material.name}</h3>
                      <span>Width: {Number(object.userData.info.width.toFixed(4))} mm</span>
                      <span>Height: {Number(object.userData.info.height.toFixed(4))} mm</span>
                      <span>Area: {Number(object.userData.info.area.toFixed(4))} mm2</span>
                      <span>Weight: {Number(object.userData.info.weight).toFixed(4)} kg/m</span>
                      <span><b>Unit price: {object.userData.price}</b></span>
                      <span className='profil col-sm-4 .col-md-4 .col-xs-4'>{consoleUtils.getSvg(object)}</span>
                    </li>
                  )
                }
              )}

              {objects.length &&
              (objects.filter(object => (polyamides.indexOf(object) < 0)).map((object, i) => {
                  return (
                    <li className="list-group-flush" key={i}>
                      <h4>Object: {object.name}</h4>
                      <h3>Material: {object.userData.material.name}</h3>
                      <span>Width: {Number(object.userData.info.width.toFixed(4))} mm</span>
                      <span>Height: {Number(object.userData.info.height.toFixed(4))} mm</span>
                      <span>Area: {Number(object.userData.info.area.toFixed(4))} mm2</span>
                      <span>Weight: {Number(object.userData.info.weight).toFixed(4)} kg/m</span>
                      <span className='profil col-sm-4 .col-md-4 .col-xs-4'>{consoleUtils.getSvg(object)}</span>
                    </li>
                  )
                }
              ))}
              <hr />
              {polyamides.length &&
              <div>
                <h3>System weight: <b>{systemWeight.toFixed(4)} kg/m</b></h3>
              </div>
              }
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="info">Order</Button>
            <Button onClick={this.props.calculateHide}>Cancel</Button>
          </Modal.Footer>
        </Modal>
        }
      </div>
    )
  }

  static propTypes = {
    show: PropTypes.bool,
    polyamides: PropTypes.array,
    scene: PropTypes.object
  }
}
