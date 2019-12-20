import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import './Modal.css';
import { FormattedMessage } from 'react-intl';

export default class ModalComponent extends Component {
  render() {
    return (
      <div>
        {this.props.show && (
          <Modal
            show={this.props.show}
            onHide={this.props.modalHide}
            bsSize="large"
          >
            <Modal.Header closeButton>
              <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {this.props.message && (
                <div>
                  {this.props.message}
                  {this.props.link && (
                    <a href={this.props.link}> {this.props.title}</a>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <FormattedMessage id="btn.ok" defaultMessage="Ok">
                {value => (
                  <Button onClick={this.props.modalHide}>{value}</Button>
                )}
              </FormattedMessage>
              <FormattedMessage id="btn.cancel" defaultMessage="Cancel">
                {value => (
                  <Button onClick={this.props.modalHide}>{value}</Button>
                )}
              </FormattedMessage>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    );
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    show: PropTypes.bool,
    message: PropTypes.string,
    title: PropTypes.string,
    link: PropTypes.string,
    modalHide: PropTypes.func
  };
}
