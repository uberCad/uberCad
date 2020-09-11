import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import logo from './logo.svg';
import userPic from './userPhoto.png';
import { appName } from './../../config';
import './Header.css';
import history from '../../config/history';
import DBObjectList from '../ObjectFromDBList/DBObjectListContainer';
import {
  Navbar,
  Nav,
  NavItem,
  NavDropdown,
  MenuItem,
  Modal,
  Form,
  Table,
  FormGroup,
  ControlLabel,
  FormControl,
  HelpBlock,
  Button
} from 'react-bootstrap';
import { drawDxf } from '../../actions/cad';
import { parseDxf } from '../../services/dxfService';

export default class HeaderComponent extends Component {
  logout = () => {
    this.props.logout(history);
  };

  constructor(props) {
    super(props);
    this.state = {
      title: '',
      file: null,
      show: false,
      error: ''
    };
  }

  handleClose = () => {
    this.setState({ show: false });
  };

  handleShow = () => {
    this.setState({
      show: true
    });
  };

  handleChange = event => {
    const name = event.target.name;
    if (name === 'file') {
      this.setState({
        file: event.target.files[0],
        error: ''
      });
    } else {
      this.setState({
        [name]: event.target.value,
        error: ''
      });
    }
  };

  addObject = () => {
    if (!this.props.editor.scene) {
      return value => <div href="/cad/editObjectElement">{value}</div>;
    } else {
      const file = this.state.file;
      if (!file) {
        this.setState({ error: 'Missing project file' });
      } else {
        this.setState({ error: '' });
      }
      if (file) {
        let fileReader = new FileReader();
        let container = document.getElementById('sceneID');
        let editor = this.props.editor;
        fileReader.onload = function() {
          let fileText = fileReader.result;
          drawDxf(parseDxf(fileText), container, null, editor);
          let { scene, camera, renderer } = editor;
          renderer.render(scene, camera);
        };
        fileReader.readAsText(file);
        this.props.editor.options.oldMode = this.props.editor.options.selectMode;
        this.props.chooseTool('MOVE_NEW_OBJECT');
        this.handleClose();
      }
    }
  };

  // test = event => {
  //   let id = event.currentTarget.id;
  //   if (id != 'type') {
  //     this.props.getObjectFromDB(id);
  //     this.handleClose();
  //   } else {
  //     console.log (document.getObjectById('DB_object_list'));
  //   }
  // };

  // getObject = (id) => {
  //   let objects = this.props.getObjectFromDB('all', 'test_list');
  //   let testArr = [];
  //   for (let id = 0; id < 5; id++) {
  //     testArr[id] = (
  //       <tr id={'object_table_' + id} onClick={this.test}>
  //         <td>
  //           <img src={addElement} alt="addElement"/>
  //         </td>
  //         <td>test</td>
  //         <th>Date</th>
  //         <td>information about object</td>
  //       </tr>
  //     );
  //   }
  //   return testArr;
  // };

  oppenButton = () => {
    if (!this.props.editor.scene) {
      return value => <Button href="/cad/editObjectElement">{value}</Button>;
    } else {
      return value => <Button onClick={this.addObject}>{value}</Button>;
    }
  };

  // tester = (event) => {
  //   console.log(event);
  //   debugger;
  // };

  render() {
    const { objects } = this.props;
    return (
      <Navbar className="nav-head header" collapseOnSelect fluid>
        <Navbar.Header>
          <Navbar.Brand>
            <a
              href={`${process.env.PUBLIC_URL}/`}
              className="logo navbar-brand"
            >
              {appName}
              <img src={logo} alt="logo" width={24} />
            </a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav className="nav-group">
            <NavItem href={`${process.env.PUBLIC_URL}/`} className= "li-Header">
              <FormattedMessage
                id="header.projects"
                defaultMessage="Projects!"
              />
            </NavItem>

            {/*<NavItem onClick={this.handleShow}>*/}
            {/*<FormattedMessage id="header.store" defaultMessage="Store" />*/}

            <NavItem>
              <DBObjectList />
            </NavItem>

            <NavItem href={`${process.env.PUBLIC_URL}/demo`} className= "li-Header">
              <FormattedMessage
                id="header.creators"
                defaultMessage="Creators"
              />
            </NavItem>
          </Nav>
          <Nav className="nav-group-right" pullRight>
            {this.props.username && (
              <NavDropdown
                title={
                  <div className="pull-left">
                    <img
                      className="user-pic img-circle"
                      src={this.props.pictureUrl || userPic}
                      alt="user pic"
                    />
                    {this.props.username}
                  </div>
                }
                id="basic-nav-dropdown"
              >
                <MenuItem>
                  <FormattedMessage
                    id="header.myProjects"
                    defaultMessage="My Projects"
                  />
                </MenuItem>
                <MenuItem>
                  <FormattedMessage
                    id="header.editProfile"
                    defaultMessage="Edit profile"
                  />
                </MenuItem>
                <MenuItem divider />
                <MenuItem onClick={this.logout}>
                  <FormattedMessage
                    id="header.logout"
                    defaultMessage="Logout"
                  />
                </MenuItem>
              </NavDropdown>
            )}
            {!this.props.username && (
              <NavItem href={`${process.env.PUBLIC_URL}/login`}>
                <FormattedMessage id="header.login" defaultMessage="Login" />
              </NavItem>
            )}
            {!this.props.username && (
              <NavItem href={`${process.env.PUBLIC_URL}/sign-up`}>
                <FormattedMessage id="header.signUp" defaultMessage="Sign Up" />
              </NavItem>
            )}

            <NavItem role="button" onClick={() => this.props.setLocale('en')}>
              EN
            </NavItem>
            <NavItem role="button" onClick={() => this.props.setLocale('ru')}>
              RU
            </NavItem>
          </Nav>
        </Navbar.Collapse>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <FormattedMessage
              id="addElement.modal.title"
              defaultMessage="Add new element"
            >
              {value => <Modal.Title>{value}</Modal.Title>}
            </FormattedMessage>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Table>
                <thead>
                  <tr>
                    <th>Pic</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Inform</th>
                  </tr>
                </thead>
                <tbody id="DB_object_list"></tbody>
              </Table>
            </Form>
            <Form
              onSubmit={event => {
                event.preventDefault();
                return false;
              }}
            >
              <FormGroup controlId="formControlsFile">
                <FormattedMessage
                  id="addObject.modal.fileLabel"
                  defaultMessage="Load File"
                >
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage
                  id="addObject.modal.filePlaceholder"
                  defaultMessage="Chose file ..."
                >
                  {placeholder => (
                    <FormControl
                      type="file"
                      name="file"
                      accept=".dxf"
                      placeholder={placeholder}
                      onChange={this.handleChange}
                    />
                  )}
                </FormattedMessage>
                <HelpBlock>Only *.dxf file supported</HelpBlock>
                <FormControl.Feedback />
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            {this.state.error && (
              <HelpBlock className="warning">{this.state.error}</HelpBlock>
            )}
            <FormattedMessage id="addObject.open" defaultMessage="Open">
              {/*{this.oppenButton()}*/}
              {value => (
                <Button
                  href={
                    !this.props.editor.scene ? '/cad/editObjectElement' : ''
                  }
                  onClick={this.addObject}
                >
                  {value}
                </Button>
              )}
            </FormattedMessage>
            <FormattedMessage id="btn.cancel" defaultMessage="Close">
              {/*{this.oppenButton()}*/}
              {value => <Button onClick={this.handleClose}>{value}</Button>}
            </FormattedMessage>
          </Modal.Footer>
        </Modal>
      </Navbar>
    );
  }

  static propTypes = {
    setLocale: PropTypes.func.isRequired,
    changeStateProps: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    chooseTool: PropTypes.func,
    pictureUrl: PropTypes.string
  };
}
