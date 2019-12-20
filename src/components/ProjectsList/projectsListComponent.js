import React, { Component, Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './ProjectsList.css';
import { Row, Col } from 'react-bootstrap';

const TitleField = ({ id, defaultMessage, sort, sortFieldName, sortUp }) => (
  <FormattedMessage id={id} defaultMessage={defaultMessage}>
    {title => (
      <Fragment>
        <span onClick={() => sort(title)}>{title}</span>
        {title === sortFieldName ? (
          <span className={sortUp ? 'fa fa-level-up' : 'fa fa-level-down'} />
        ) : null}
      </Fragment>
    )}
  </FormattedMessage>
);

TitleField.propTypes = {
  id: PropTypes.string,
  defaultMessage: PropTypes.string,
  sortFieldName: PropTypes.string,
  sortUp: PropTypes.bool,
  sort: PropTypes.func
};

export default class ProjectsListComponent extends Component {
  sort = field => {
    let { projects, projectsFilter, sortUp } = this.props;
    this.props.sortField(projects, projectsFilter, field, !sortUp);
  };

  render() {
    let { projects, sortFieldName, sortUp } = this.props;
    return (
      <div className="data-projects">
        <Row className="table-head">
          <Col xs={0} sm={1} className="table-head-name" />
          <Col xs={3} sm={3} className="hidden-sm-down table-head-name">
            <TitleField
              id="projects.title"
              defaultMessage="title!"
              sort={this.sort}
              sortFieldName={sortFieldName}
              sortUp={sortUp}
            />
          </Col>
          <Col xs={3} sm={2} className="hidden-sm-down table-head-name">
            <TitleField
              id="projects.createdBy"
              defaultMessage="created by"
              sort={this.sort}
              sortFieldName={sortFieldName}
              sortUp={sortUp}
            />
          </Col>
          <Col xs={2} sm={2} className="hidden-sm-down table-head-name">
            <TitleField
              id="projects.rating"
              defaultMessage="rating"
              sort={this.sort}
              sortFieldName={sortFieldName}
              sortUp={sortUp}
            />
            <br />
            <i>
              <FormattedMessage id="projects.price" defaultMessage="price" />/
              <FormattedMessage
                id="projects.efficiency"
                defaultMessage="efficiency"
              />
            </i>
          </Col>
          <Col xs={2} sm={2} className="hidden-sm-down table-head-name">
            <FormattedMessage id="projects.details" defaultMessage="details" />
          </Col>
          <Col xs={2} sm={2} className="hidden-sm-down table-head-name">
            <TitleField
              id="projects.status"
              defaultMessage="status"
              sort={this.sort}
              sortFieldName={sortFieldName}
              sortUp={sortUp}
            />
          </Col>
        </Row>
        {projects.map((project, i) => (
          <Row key={i} className="table-row">
            <Col xs={1} className="table-data icon">
              <i className="fa fa-cubes fa-eye" />
            </Col>
            <Col xs={3} className="table-data title">
              <Link to={`${process.env.PUBLIC_URL}/project/${project._key}`}>
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
              {project.rating}
            </Col>
            <Col xs={2} className="table-data">
              {project.description}
            </Col>
            <Col xs={1} className="table-data">
              {project.status}
            </Col>
          </Row>
        ))}
      </div>
    );
  }

  static propTypes = {
    projects: PropTypes.array.isRequired,
    projectsFilter: PropTypes.string,
    sortUp: PropTypes.bool,
    sortField: PropTypes.func,
    sortFieldName: PropTypes.string
  };
}
