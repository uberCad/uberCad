import React, { Component } from 'react';
import UserService from '../../services/UserService';
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
import {API_HOST} from "../../config";

export default class UserLoginComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      password: '',
      errorMessage: ''
    };
  }

  componentDidMount() {
    console.log('login:componentDidMount()');
    const token = this.props.match.params.token;
    const username = this.props.match.params.username;
      console.log('login:componentDidMount()', {token, username});

    if (token && username) {
        UserService.updateToken(token);
        this.props.getProfile();
        this.props.history.push(`${process.env.PUBLIC_URL}/`);
    }
  }

  authorize = () => {
    this.props
      .authorize(this.state.name, this.state.password, this.props.history)
      .then(res => {
        if (res) {
          this.setState({ errorMessage: res });
        }
      });
  };

  logout = () => {
    console.log('this.props.history ', this.props.history);
    this.props.logout(this.props.history);
  };

  render() {
    return (
      <Row className="container">
        <Form>
          <Row>
            <Col smOffset={4} sm={6}>
              <FormattedMessage id="userLogin.title" defaultMessage="Log In">
                {value => <h3>{value}</h3>}
              </FormattedMessage>

              <Col sm={3}>
                <a
                  href={
                    'https://github.com/login/oauth/authorize?scope=user:email&client_id=' +
                    process.env.REACT_APP_GITHUB_CLIENT_ID
                  }
                >
                  <span className="fa fa-github" /> GitHub
                </a>
              </Col>
              <Col sm={3}>
                <a
                  href={
                    'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=offline&scope=email&client_id=' +
                    process.env.REACT_APP_GOOGLE_CLIENT_ID +
                    '&redirect_uri=' +
                    encodeURI(process.env.REACT_APP_GOOGLE_REDIRECT_URL)
                  }
                >
                  <span className="fa fa-google" /> Google
                </a>
              </Col>
              <Col sm={3}>
                <a
                  href={`${API_HOST}auth/facebook`}
                >
                  <span className="fa fa-facebook-official" /> Facebook
                </a>
              </Col>

              <Col sm={3}>
                <a
                  href={
                    'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=7868w4a86yrezy&redirect_uri=' +
                    encodeURI(process.env.REACT_APP_REDIRECT_URL) +
                    '&state=987654321&scope=r_basicprofile%20r_emailaddress'
                  }
                >
                  <span className="fa fa-linkedin" /> Linkedin
                </a>
              </Col>
              <br />
              <hr />
              <FormattedMessage
                id="userLogin.description"
                defaultMessage="Register Username & Password"
              >
                {value => <h5>{value}</h5>}
              </FormattedMessage>
              <FormGroup
                controlId="formBasicText"
                validationState={this.getValidationState()}
              >
                <div className="input-group-login">
                  <FormattedMessage
                    id="userLogin.labelUsername"
                    defaultMessage="Username"
                  >
                    {value => (
                      <ControlLabel className="label">{value}</ControlLabel>
                    )}
                  </FormattedMessage>
                  <FormattedMessage
                    id="userLogin.usernamePlaceholder"
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
                    id="userLogin.labelPassword"
                    defaultMessage="Password"
                  >
                    {value => (
                      <ControlLabel className="label">{value}</ControlLabel>
                    )}
                  </FormattedMessage>
                  <FormattedMessage
                    id="userLogin.passwordPlaceholder"
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
                id="userLogin.btnSignIn"
                defaultMessage="Sign in ..."
              >
                {value => <Button onClick={this.authorize}>{value}</Button>}
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
    this.setState({ [name]: value });
  };

  static propTypes = {
    lang: PropTypes.string.isRequired,
    getProfile: PropTypes.func.isRequired,
    authorize: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        token: PropTypes.string,
        username: PropTypes.string
      })
    }),
    history: PropTypes.object
  };
}
