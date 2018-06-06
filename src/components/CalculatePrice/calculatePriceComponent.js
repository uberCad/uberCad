import React, { Component } from 'react'
import PropTypes from 'prop-types'
import consoleUtils from '../../services/consoleUtils'
import { Button, Modal, ListGroup } from 'react-bootstrap'
import './CalculatePrice.css'
import { FormattedMessage } from 'react-intl'

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
      else return systemWeight
    })

    const ObjectComponent = ({object}) => {
      return (
        <li className="list-group-flush">
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
          <span className='profil col-sm-4 .col-md-4 .col-xs-4'>{consoleUtils.getSvg(object)}</span>
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
                <Button bsStyle="info">{value}</Button>
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
