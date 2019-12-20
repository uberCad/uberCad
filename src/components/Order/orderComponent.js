import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import './Order.css';
import consoleUtils from '../../services/consoleUtils';
import PropTypes from 'prop-types';

export default class OrderComponent extends Component {
  componentDidMount() {
    const { key, hash } = this.props.match.params;
    this.props.getOrder(key, hash);
  }

  render() {
    const { orderObjects } = this.props;
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    };

    return (
      <div className="form-horizontal form-custom container">
        <span>
          Order created:{' '}
          {new Date(this.props.createdAt).toLocaleDateString(
            this.props.lang,
            dateOptions
          )}
        </span>
        <div>
          <legend>Objects information</legend>
          <ul className="polyamide-list">
            {orderObjects &&
              orderObjects.map((item, i) => {
                return (
                  <li className="list-group-flush" key={i}>
                    <FormattedMessage
                      id="calculatePrice.modal.object"
                      defaultMessage="Object"
                    >
                      {value => (
                        <h4>
                          {value}: {item.object.name}
                        </h4>
                      )}
                    </FormattedMessage>
                    <FormattedMessage
                      id="calculatePrice.modal.material"
                      defaultMessage="Material"
                    >
                      {value => (
                        <h3>
                          {value}: {item.object.userData.material.name}
                        </h3>
                      )}
                    </FormattedMessage>
                    <FormattedMessage
                      id="calculatePrice.modal.width"
                      defaultMessage="Width"
                    >
                      {value => (
                        <span>
                          {value}:{' '}
                          {Number(item.object.userData.info.width.toFixed(4))}{' '}
                          mm
                        </span>
                      )}
                    </FormattedMessage>
                    <FormattedMessage
                      id="calculatePrice.modal.height"
                      defaultMessage="Height"
                    >
                      {value => (
                        <span>
                          {value}:{' '}
                          {Number(item.object.userData.info.height.toFixed(4))}{' '}
                          mm
                        </span>
                      )}
                    </FormattedMessage>
                    <FormattedMessage
                      id="calculatePrice.modal.area"
                      defaultMessage="Area"
                    >
                      {value => (
                        <span>
                          {value}:{' '}
                          {Number(item.object.userData.info.area.toFixed(4))}{' '}
                          mm2
                        </span>
                      )}
                    </FormattedMessage>
                    <FormattedMessage
                      id="calculatePrice.modal.weight"
                      defaultMessage="Weight"
                    >
                      {value => (
                        <span>
                          {value}:{' '}
                          {Number(item.object.userData.info.weight).toFixed(4)}{' '}
                          kg/m
                        </span>
                      )}
                    </FormattedMessage>
                    {item.object.userData.price && (
                      <FormattedMessage
                        id="calculatePrice.modal.price"
                        defaultMessage="Unit price"
                      >
                        {value => (
                          <span>
                            {value}: {item.object.userData.price}
                          </span>
                        )}
                      </FormattedMessage>
                    )}
                    <span className="profile col-sm-4 .col-md-4 .col-xs-4">
                      {consoleUtils.getSvg(item.object)}
                    </span>

                    <FormattedMessage
                      id="calculatePrice.modal.laserMarking"
                      defaultMessage="Laser marking"
                    >
                      {value => (
                        <span>
                          {value}:{' '}
                          {item.object.userData.options.laserMarking
                            ? 'true'
                            : 'false'}
                        </span>
                      )}
                    </FormattedMessage>

                    {item.object.userData.options.laserMarking && (
                      <div>
                        <FormattedMessage
                          id="calculatePrice.modal.type"
                          defaultMessage="Type"
                        >
                          {value => (
                            <span>
                              {value}: {item.object.userData.options.type}
                            </span>
                          )}
                        </FormattedMessage>
                        <FormattedMessage
                          id="calculatePrice.modal.color"
                          defaultMessage="Color"
                        >
                          {value => (
                            <span>
                              {value}: {item.object.userData.options.color}
                            </span>
                          )}
                        </FormattedMessage>
                      </div>
                    )}

                    <FormattedMessage
                      id="calculatePrice.modal.length"
                      defaultMessage="Length"
                    >
                      {value => (
                        <span>
                          {value}: {item.object.userData.options.length}
                        </span>
                      )}
                    </FormattedMessage>

                    <FormattedMessage
                      id="calculatePrice.modal.orderQty"
                      defaultMessage="Order quantity"
                    >
                      {value => (
                        <span>
                          {value}: {item.object.userData.options.orderQty}
                        </span>
                      )}
                    </FormattedMessage>
                  </li>
                );
              })}
          </ul>
        </div>

        <div>
          <legend>Contact Information</legend>
          {/*Text input First-Name*/}
          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="firstName">
              First Name
            </label>
            <div className="col-md-4">
              <div className="input-group">
                <div className="input-group-addon input-addon">
                  <i className="fa fa-user"></i>
                </div>
                <span className="form-control input-md">
                  {this.props.contactInformation &&
                  this.props.contactInformation.firstName
                    ? this.props.contactInformation.firstName
                    : 'Not indicated'}
                </span>
              </div>
            </div>
          </div>

          {/*Text input Last Name*/}
          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="lastName">
              Last Name
            </label>
            <div className="col-md-4">
              <div className="input-group">
                <div className="input-group-addon input-addon">
                  <i className="fa fa-male" />
                </div>
                <span className="form-control input-md">
                  {this.props.contactInformation &&
                  this.props.contactInformation.lastName
                    ? this.props.contactInformation.lastName
                    : 'Not indicated'}
                </span>
              </div>
            </div>
          </div>

          {/*Text input Company*/}
          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="company">
              Company
            </label>
            <div className="col-md-4">
              <div className="input-group">
                <div className="input-group-addon input-addon">
                  <i className="fa fa-institution" />
                </div>
                <span className="form-control input-md">
                  {this.props.contactInformation &&
                  this.props.contactInformation.company
                    ? this.props.contactInformation.company
                    : 'Not indicated'}
                </span>
              </div>
            </div>
          </div>

          {/*Text input place*/}
          <div className="form-group">
            <label
              className="col-md-4 control-label col-xs-12"
              htmlFor="addressCountry"
            >
              Address
            </label>
            <div className="col-md-2  col-xs-4">
              <span className="form-control input-md">
                {this.props.contactInformation &&
                this.props.contactInformation.addressCountry
                  ? this.props.contactInformation.addressCountry
                  : 'Not indicated'}
              </span>
            </div>
            <div className="col-md-2 col-xs-4">
              <span className="form-control input-md">
                {this.props.contactInformation &&
                this.props.contactInformation.addressCity
                  ? this.props.contactInformation.addressCity
                  : 'Not indicated'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="addressStreet">
              Street
            </label>
            <div className="col-md-4  col-xs-4">
              <span className="form-control input-md">
                {this.props.contactInformation &&
                this.props.contactInformation.addressStreet
                  ? this.props.contactInformation.addressStreet
                  : 'Not indicated'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label
              className="col-md-4 control-label col-xs-12"
              htmlFor="zipCode"
            >
              Zip Code/Zone
            </label>
            <div className="col-md-4  col-xs-4">
              <span className="form-control input-md">
                {this.props.contactInformation &&
                this.props.contactInformation.zipCode
                  ? this.props.contactInformation.zipCode
                  : 'Not indicated'}
              </span>
            </div>
          </div>

          {/*Text input Phone number*/}
          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="phoneNumber ">
              Phone number{' '}
            </label>
            <div className="col-md-4">
              <div className="input-group">
                <div className="input-group-addon input-addon">
                  <i className="fa fa-phone" />
                </div>
                <span className="form-control input-md">
                  {this.props.contactInformation &&
                  this.props.contactInformation.phoneNumber
                    ? this.props.contactInformation.phoneNumber
                    : 'Not indicated'}
                </span>
              </div>
            </div>
          </div>

          {/*Text input Email Address*/}
          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="emailAddress">
              Email Address
            </label>
            <div className="col-md-4">
              <div className="input-group">
                <div className="input-group-addon input-addon">
                  <i className="fa fa-envelope-o" />
                </div>
                <span className="form-control input-md">
                  {this.props.contactInformation &&
                  this.props.contactInformation.emailAddress
                    ? this.props.contactInformation.emailAddress
                    : 'Not indicated'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="col-md-4 control-label" htmlFor="comment">
              Сomment
            </label>
            <div className="col-md-4">
              <span className="form-control comment">
                {this.props.contactInformation &&
                this.props.contactInformation.comment
                  ? this.props.contactInformation.comment
                  : 'Not indicated'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    contactInformation: PropTypes.object,
    order: PropTypes.array,
    orderObjects: PropTypes.array,
    createdAt: PropTypes.number,
    getOrder: PropTypes.func,
    match: PropTypes.shape({
      params: PropTypes.shape({
        key: PropTypes.string,
        hash: PropTypes.string
      })
    })
  };
}
