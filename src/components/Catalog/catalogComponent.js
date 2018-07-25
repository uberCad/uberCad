import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal } from 'react-bootstrap'
import './Catalog.css'
import { FormattedMessage } from 'react-intl'

export default class CatalogComponent extends Component {
  render () {
    return (
      <div>
        <FormattedMessage id='catalog.btnCatalogTitle' defaultMessage='Catalog'>
          {title =>
            <button onClick={this.props.catalogShow} title={title} className='btn-catalog'/>
          }
        </FormattedMessage>

        {this.props.show &&
        <Modal show={this.props.show} onHide={this.props.catalogHide} bsSize='large'>
          <Modal.Header closeButton>
            <FormattedMessage id='catalog.modal.title' defaultMessage='Catalog'>
              {title =>
                <Modal.Title>{title}</Modal.Title>
              }
            </FormattedMessage>
          </Modal.Header>
          <Modal.Body>
            <div>some products</div>

          </Modal.Body>
          <Modal.Footer>
            <FormattedMessage id='btn.cancel' defaultMessage='Cancel'>
              {value =>
                <Button onClick={this.props.catalogHide}>{value}</Button>
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
    show: PropTypes.bool
    // polyamides: PropTypes.array,
    // scene: PropTypes.object,
    // form: PropTypes.object
  }
}
