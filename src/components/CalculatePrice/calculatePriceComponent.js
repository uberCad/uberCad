import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal } from 'react-bootstrap'
import './CalculatePrice.css'
import { FormattedMessage } from 'react-intl'
import Scene from '../../services/sceneService'
import OrderForm from '../OrderForm/orderFormComponent'

export default class CalculatePriceComponent extends Component {
  calculate = () => {
    this.props.calculate(this.props.scene)
  }

  order = () => {
    let form = this.props.form.order ? this.props.form.order.values : {}
    let orderObjects = []
    const {polyamides} = this.props

    polyamides.forEach((object, i) => {
      if (form.objects[i] && form.objects[i].checked) {
        object.userData.options = form.objects[i]
        orderObjects.push(object)
      }
    })
    const contactInformation = {
      addressCity: form.addressCity,
      addressCountry: form.addressCountry,
      addressStreet: form.addressStreet,
      comment: form.comment,
      company: form.company,
      emailAddress: form.emailAddress,
      firstName: form.firstName,
      lastName: form.lastName,
      phoneNumber: form.phoneNumber,
      zipCode: form.zipCode
    }
    this.props.order(orderObjects, contactInformation)
  }

  render () {
    const {polyamides} = this.props
    const objects = Scene.getObjects(this.props.scene, true)

    let systemWeight = 0
    objects.map((object) => {
      if (object.userData.info) return (systemWeight += object.userData.info.weight)
      else return systemWeight
    })

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
            {polyamides.length && <OrderForm objects={polyamides} />}

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
    scene: PropTypes.object,
    form: PropTypes.object
  }
}
