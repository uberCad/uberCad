import React, { Component } from 'react'
import PropTypes from 'prop-types'
import consoleUtils from '../../services/consoleUtils'
import { Button, Modal, ListGroup } from 'react-bootstrap'
import './CalculatePrice.css'
import { FormattedMessage } from 'react-intl'
import Scene from '../../services/sceneService'

export default class CalculatePriceComponent extends Component {
  calculate = () => {
    this.props.calculate(this.props.scene)
  }

  setLength = (object, event) => {
    const length = Number(event.target.value).toFixed(4)
    if (length >= 3 && length <= 7) {
      this.props.setLength(object, length)
    }
  }

  order = () => {
    let error = null
    let orderObjects = []

    const objects = Scene.getObjects(this.props.scene, true)
    objects.forEach(object => {
        if (object.userData.options && object.userData.options.checked) {
          const length = Number(object.userData.options.length).toFixed(4)
          if (length < 3 || length > 7) {
            error = 'The length should be in the range of 3 to 7 meters'
          } else {
            orderObjects.push(object)
          }
        }
      }
    )

    if (error) {
      console.log('You have walidation error.......', error)
    } else {
      console.log('orderObjects = ', orderObjects)
    }
  }

  render () {
    const {polyamides} = this.props
    const objects = Scene.getObjects(this.props.scene, true)

    let systemWeight = 0
    objects.map((object) => {
      if (object.userData.info) return (systemWeight += object.userData.info.weight)
      else return systemWeight
    })

    const ObjectComponent = ({object}) => {
      if (!object.userData.options) {
        object.userData.options = {
          checked: false,
          laser: {
            checked: false,
            type: null,
            color: null
          },
          length: ''
        }
      }

      return (
        <li className='list-group-flush'>
          <input type='checkbox'
                 value='object'
                 checked={object.userData.options.checked}
                 onChange={() => {
                   this.props.checkObject(object)
                 }}
          />

          <FormattedMessage id='calculatePrice.modal.object' defaultMessage='Object'>
            {value =>
              <h4>{value}: {object.name}</h4>
            }
          </FormattedMessage>
          <FormattedMessage id='calculatePrice.modal.material' defaultMessage='Material'>
            {value =>
              <h3>{value}: {object.userData.material.name}</h3>
            }
          </FormattedMessage>
          <FormattedMessage id='calculatePrice.modal.width' defaultMessage='Width'>
            {value =>
              <span>{value}: {Number(object.userData.info.width.toFixed(4))} mm</span>
            }
          </FormattedMessage>
          <FormattedMessage id='calculatePrice.modal.height' defaultMessage='Height'>
            {value =>
              <span>{value}: {Number(object.userData.info.height.toFixed(4))} mm</span>
            }
          </FormattedMessage>
          <FormattedMessage id='calculatePrice.modal.area' defaultMessage='Area'>
            {value =>
              <span>{value}: {Number(object.userData.info.area.toFixed(4))} mm2</span>
            }
          </FormattedMessage>
          <FormattedMessage id='calculatePrice.modal.weight' defaultMessage='Weight'>
            {value =>
              <span>{value}: {Number(object.userData.info.weight).toFixed(4)} kg/m</span>
            }
          </FormattedMessage>
          {object.userData.price &&
          <FormattedMessage id='calculatePrice.modal.price' defaultMessage='Unit price'>
            {value =>
              <span><b>{value}: {object.userData.price}</b></span>
            }
          </FormattedMessage>}
          <span className='profile col-sm-4 .col-md-4 .col-xs-4'>{consoleUtils.getSvg(object)}</span>

          {(object.userData.options && object.userData.options.checked) &&
          <div>
            <label>
              <input type='checkbox'
                     className='laser'
                     value='laser'
                     checked={object.userData.options && object.userData.options.laser && object.userData.options.laser.checked}
                     onChange={() => {
                       this.props.checkLaser(object)
                     }}
              />
              Laser marking
            </label>
            {object.userData.options.laser && object.userData.options.laser.checked && (
              <div>
                Type:
                <label>
                  <input type='radio' name='type' value='standart'
                         checked={object.userData.options.laser.type === 'standart'}
                         onChange={(e) => {
                           this.props.changeLaserOptions(object, e)
                         }}
                  />
                  Standart
                </label>
                <label>
                  <input type='radio' name='type' value='logo'
                         checked={object.userData.options.laser.type === 'logo'}
                         onChange={(e) => {
                           this.props.changeLaserOptions(object, e)
                         }}
                  />
                  Logo
                </label>
                <br/>
                Color:
                <label>
                  <input type='radio' name='color' value='white'
                         checked={object.userData.options.laser.color === 'white'}
                         onChange={(e) => {
                           this.props.changeLaserOptions(object, e)
                         }}/>
                  White
                </label>
                <label>
                  <input type='radio' name='color' value='grey'
                         checked={object.userData.options.laser.color === 'grey'}
                         onChange={(e) => {
                           this.props.changeLaserOptions(object, e)
                         }}/>
                  Grey
                </label>
              </div>
            )}
            <br/>
            <label>
              Length
              <input type='number'
                     value={object.userData.options.length}
                     onChange={(event) => {
                       this.setLength(object, event)
                     }}
              />
              {(object.userData.options.length < 3 || object.userData.options.length > 7)
              && <span className='warning'>The length should be in the range of 3 to 7 meters</span>}
            </label>
          </div>
          }
        </li>
      )
    }

    return (
      <div>
        <FormattedMessage id='calculatePrice.btnCalculateTitle' defaultMessage='Calculate price'>
          {title =>
            <button onClick={this.calculate} title={title} className='btn-calc'/>
          }
        </FormattedMessage>

        {this.props.show &&
        <Modal show={this.props.show} onHide={this.props.calculateHide} bsSize='large'>
          <Modal.Header closeButton>
            <FormattedMessage id='calculatePrice.modal.title' defaultMessage='Polyamide'>
              {title =>
                <Modal.Title>{title}</Modal.Title>
              }
            </FormattedMessage>
          </Modal.Header>
          <Modal.Body>
            <ListGroup componentClass='ul' className='polyamide-list'>
              {polyamides.length &&
              polyamides.map((object, i) => {
                  return (
                    <ObjectComponent object={object} key={i}/>
                  )
                }
              )}

              {objects.length &&
              (objects.filter(object => (polyamides.indexOf(object) < 0)).map((object, i) => {
                  return (
                    <ObjectComponent object={object} key={i}/>
                  )
                }
              ))}
              <hr/>
              {polyamides.length &&
              <div>
                <FormattedMessage id='calculatePrice.modal.systemWeight' defaultMessage='System weight'>
                  {value =>
                    <h3>{value}: <b>{systemWeight.toFixed(4)} kg/m</b></h3>
                  }
                </FormattedMessage>
              </div>
              }
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
            <FormattedMessage id='btn.order' defaultMessage='Order'>
              {value =>
                <Button bsStyle='info' onClick={this.order}>{value}</Button>
              }
            </FormattedMessage>
            <FormattedMessage id='btn.cancel' defaultMessage='Cancel'>
              {value =>
                <Button onClick={this.props.calculateHide}>{value}</Button>
              }
            </FormattedMessage>
          </Modal.Footer>
        </Modal>
        }
      </div>
    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    show: PropTypes.bool,
    polyamides: PropTypes.array,
    scene: PropTypes.object
  }
}
