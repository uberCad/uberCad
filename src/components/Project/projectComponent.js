import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Row, Col, Button, Modal } from 'react-bootstrap';
import './Project.css';

export default class ProjectComponent extends Component {
  // _input: ?HTMLInputElement;

  constructor(props) {
    super(props);
    this.state = {
      show: false,
      renameProject: false,
      renameSnapshot: false,
      snapshotId: null
    };
  }

  handleClose = () => {
    this.setState({ show: false });
  };

  handleShow = () => {
    this.setState({ show: true });
  };

  componentDidMount() {
    const { id } = this.props.match.params;
    const { preloadedProject } = this.props;
    this.props.fetchProject(id, preloadedProject);
  }

  componentDidUpdate(prevProps) {
    // обновлення списку об'єктів на сцені
    if (this._input) this._input.focus();

    if (prevProps.match.params.id !== this.props.match.params.id) {
      const { id } = this.props.match.params;
      const { preloadedProject } = this.props;
      this.props.fetchProject(id, preloadedProject);
    }
  }

  delProject = () => {
    this.handleClose();
    this.props.delProject(this.props.project._key);
  };

  renameProject = event => {
    this.props.renameProject(event.target.value);
  };

  renameProjectToggle = () => {
    this.setState({ renameProject: !this.state.renameProject });
  };

  saveProjectTitle = () => {
    this.renameProjectToggle();
    this.props.saveProjectTitle(
      this.props.project._key,
      this.props.project.title
    );
  };

  renameSnapshotToggle = event => {
    let {
      currentTarget: {
        dataset: { idx }
      }
    } = event;
    idx = Number(idx);
    idx = this.state.snapshotId === idx ? null : idx;
    this.setState({
      renameSnapshot: !this.state.renameSnapshot,
      snapshotId: idx
    });
  };

  renameSnapshot = event => {
    let {
      currentTarget: {
        dataset: { idx }
      }
    } = event;
    const snap = this.props.project.snapshots[idx];
    snap.title = event.target.value;
    this.props.renameSnapshot(snap);
  };

  saveSnapshotTitle = event => {
    this.renameSnapshotToggle(event);
    let {
      currentTarget: {
        dataset: { idx }
      }
    } = event;
    const snap = this.props.project.snapshots[idx];
    this.props.saveSnapshotTitle(snap);
  };

  archive = () => {
    this.props.archive(this.props.project);
  };

  render() {
    const { project } = this.props;
    return (
      <div className="project-page">
        {project && (
          <div className="head-project">
            <h3>Project: </h3>
            <input
              type="text"
              value={project.title}
              onChange={this.renameProject}
              onKeyPress={e => {
                if (e.key === 'Enter') this.saveProjectTitle();
              }}
              disabled={!this.state.renameProject}
              autoFocus={true}
              ref={c => (this._input = c)}
            />
            <FormattedMessage
              id="project.btnDel"
              defaultMessage="Delete project"
            >
              {value => (
                <button
                  title={value}
                  className="btn-project del"
                  onClick={this.handleShow}
                />
              )}
            </FormattedMessage>
            {project.status !== 'archive' && (
              <button
                title="Archive project"
                className="btn-project archive"
                onClick={this.archive}
              />
            )}

            {this.state.renameProject && (
              <button
                title="Save project title"
                className="btn-project save"
                onClick={this.saveProjectTitle}
              />
            )}
            {!this.state.renameProject && (
              <button
                title="Rename project"
                className="btn-project rename"
                onClick={this.renameProjectToggle}
              />
            )}
          </div>
        )}

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header>
            <FormattedMessage
              id="project.delMsg"
              defaultMessage="Delete project"
            >
              {value => <Modal.Title>{value}</Modal.Title>}
            </FormattedMessage>
          </Modal.Header>
          <Modal.Footer>
            <FormattedMessage id="btn.delete" defaultMessage="Delete">
              {value => <Button onClick={this.delProject}>{value}</Button>}
            </FormattedMessage>
            <FormattedMessage id="btn.cancel" defaultMessage="Cancel">
              {value => <Button onClick={this.handleClose}>{value}</Button>}
            </FormattedMessage>
          </Modal.Footer>
        </Modal>

        {project && (
          <div className="data-snap">
            <Row className="table-head">
              <Col xs={0} sm={1} className="table-head-name" />
              <Col xs={3} sm={3} className="hidden-sm-down table-head-name">
                <FormattedMessage id="project.title" defaultMessage="title!" />
              </Col>
              <Col xs={3} sm={2} className="hidden-sm-down table-head-name">
                <FormattedMessage
                  id="project.createdBy"
                  defaultMessage="created by"
                />
              </Col>
              <Col xs={2} sm={2} className="hidden-sm-down table-head-name">
                <FormattedMessage id="project.rating" defaultMessage="rating" />
                <br />
                <i>
                  <FormattedMessage
                    id="projects.price"
                    defaultMessage="price"
                  />
                  /
                  <FormattedMessage
                    id="projects.efficiency"
                    defaultMessage="efficiency"
                  />
                </i>
              </Col>
              <Col xs={2} sm={2} className="hidden-sm-down table-head-name">
                <FormattedMessage
                  id="projects.details"
                  defaultMessage="details"
                />
              </Col>
              <Col xs={2} sm={2} className="hidden-sm-down table-head-name">
                <FormattedMessage
                  id="projects.status"
                  defaultMessage="status"
                />
              </Col>
            </Row>

            {project.snapshots.map((snapshot, i) => (
              <Row key={i} className="table-row">
                <Col xs={1} className="table-data icon">
                  <i className="fa fa-cubes fa-eye" />
                </Col>
                <Col xs={3} className="table-data title">
                  <Col xs={10} className="cont">
                    {i !== this.state.snapshotId && (
                      <Link
                        className="table-data link"
                        to={`${process.env.PUBLIC_URL}/cad/${project._key}/${snapshot._key}`}
                      >
                        {snapshot.title}
                      </Link>
                    )}
                    {this.state.renameSnapshot && i === this.state.snapshotId && (
                      <input
                        type="text"
                        value={snapshot.title}
                        onChange={this.renameSnapshot}
                        onKeyPress={e => {
                          if (e.key === 'Enter') this.saveSnapshotTitle(e);
                        }}
                        data-idx={i}
                        autoFocus={true}
                        ref={c => (this._input = c)}
                        className="rename-snapshot"
                      />
                    )}
                    <p>34 minutes ago hardcoded</p>
                  </Col>
                  <Col xs={2}>
                    {i !== this.state.snapshotId && (
                      <button
                        title="Rename snapshot"
                        className="btn-snapshot rename"
                        onClick={this.renameSnapshotToggle}
                        data-idx={i}
                      />
                    )}
                    {this.state.renameSnapshot &&
                      i === this.state.snapshotId && (
                        <button
                          title="Rename snapshot"
                          className="btn-snapshot save"
                          onClick={this.saveSnapshotTitle}
                          data-idx={i}
                        />
                      )}
                  </Col>
                </Col>
                <Col xs={2} className="table-data">
                  project - createdBy
                  <p>Project manager hardcoded</p>
                </Col>

                <Col xs={2} className="table-data">
                  rating...
                </Col>
                <Col xs={2} className="table-data">
                  description...
                </Col>
                <Col xs={1} className="table-data">
                  {project.status}
                </Col>
              </Row>
            ))}

            <Row className="table-row">
              <Col xs={1} className="table-data icon">
                <i className="fa fa-cubes fa-eye" />
              </Col>
              <Col xs={3} className="table-data title">
                <Link
                  className="table-data link"
                  to={`${process.env.PUBLIC_URL}/cad/${project._key}`}
                >
                  {project.title}
                </Link>
                {project.fileName && <p>File name: {project.fileName}</p>}
                <p>34 minutes ago hardcoded</p>
              </Col>
              <Col xs={2} className="table-data">
                project - createdBy
                <p>Project manager hardcoded</p>
              </Col>

              <Col xs={2} className="table-data">
                rating...
              </Col>
              <Col xs={2} className="table-data">
                description...
              </Col>
              <Col xs={1} className="table-data">
                {project.status}
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  }

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    project: PropTypes.object,
    lastUpdated: PropTypes.number,
    match: PropTypes.shape({
      params: PropTypes.shape({
        id: PropTypes.string
      })
    }),

    id: PropTypes.string,
    preloadedProject: PropTypes.object,

    fetchProject: PropTypes.func.isRequired,
    delProject: PropTypes.func.isRequired,
    renameProject: PropTypes.func.isRequired,
    saveProjectTitle: PropTypes.func.isRequired,
    renameSnapshot: PropTypes.func.isRequired,
    saveSnapshotTitle: PropTypes.func.isRequired,
    archive: PropTypes.func.isRequired
  };
}
