import React, { Component } from 'react';
import {
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  ControlLabel,
  Alert
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

export default class SignUpComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      password: '',
      errorMessage: ''
    };
  }

  register = () => {
    this.props
      .register(
        {
          username: this.state.name,
          password: this.state.password
        },
        this.props.history
      )
      .then(res => {
        if (res) {
          this.setState({ errorMessage: res });
        }
      });
  };

  render() {
    return (
      <Row className="container">
        <Form>
          <Row>
            <Col smOffset={4} sm={6}>
              <FormattedMessage id="signUp.title" defaultMessage="Sign Up">
                {value => <h3>{value}</h3>}
              </FormattedMessage>
              <FormGroup
                controlId="formBasicText"
                validationState={this.getValidationState()}
              >
                <div className="input-group-login">
                  <FormattedMessage
                    id="signUp.labelUsername"
                    defaultMessage="Username"
                  >
                    {value => (
                      <ControlLabel className="label">{value}</ControlLabel>
                    )}
                  </FormattedMessage>
                  <FormattedMessage
                    id="signUp.usernamePlaceholder"
                    defaultMessage="Enter your username"
                  >
                    {value => (
                      <input
                        id={'name'}
                        name="name"
                        className="input form-control"
                        type="text"
                        value={this.state.name}
                        placeholder={value}
                        onChange={this.handleChange}
                      />
                    )}
                  </FormattedMessage>
                </div>
                <div className="input-group-login">
                  <FormattedMessage
                    id="signUp.labelPassword"
                    defaultMessage="Password"
                  >
                    {value => (
                      <ControlLabel className="label">{value}</ControlLabel>
                    )}
                  </FormattedMessage>
                  <FormattedMessage
                    id="signUp.passwordPlaceholder"
                    defaultMessage="Enter your password"
                  >
                    {value => (
                      <input
                        id="password"
                        name="password"
                        className="input form-control"
                        type="password"
                        value={this.state.password}
                        placeholder={value}
                        onChange={this.handleChange}
                      />
                    )}
                  </FormattedMessage>
                </div>

                {this.state.errorMessage && (
                  <Alert bsStyle="danger">
                    <strong>Error!</strong> {this.state.errorMessage}
                  </Alert>
                )}
              </FormGroup>
              <FormattedMessage
                id="signUp.btnSignUp"
                defaultMessage="Sign Up ..."
              >
                {value => (
                  <Button className="" onClick={this.register}>
                    {value}
                  </Button>
                )}
              </FormattedMessage>
            </Col>
          </Row>
        </Form>
      </Row>
    );
  }

  getValidationState() {
    const nameLength = this.state.name.length;
    const passwordLength = this.state.password.length;
    if (nameLength < 1 || passwordLength < 1) {
      return 'error';
    }
    return null;
  }

  handleChange = event => {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({
      [name]: value
    });
  };

  static propTypes = {
    lang: PropTypes.string.isRequired,
    register: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    history: PropTypes.object
  };
}
