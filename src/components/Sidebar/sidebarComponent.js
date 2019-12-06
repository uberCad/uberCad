import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Sidebar.css';
import ActiveEntities from '../ActiveEntities/activeEntitiesComponentContainer';
import PanelLayers from '../PanelLayers/panelLayersComponentContainer';
import PanelObjects from '../PanelObjects/panelObjectsComponentContainer';
import PanelSnapshots from '../PanelSnapshots/panelSnapshotsComponentContainer';
import PanelEdit from '../PanelEdit/panelEditComponentContainer';
import PanelInfo from '../PanelInfo/panelInfoComponentContainer';

export default class SidebarComponent extends Component {
  toggleSidebar = () => {
    this.props.toggleSidebar(!this.props.active, this.props.editor);
  };

  setActiveTab = ({
    currentTarget: {
      dataset: { panelIdx, tabIdx }
    }
  }) => {
    this.props.toggleTab(parseInt(panelIdx, 10), parseInt(tabIdx, 10));
  };

  tabTitle = (tab, panelIdx, tabIdx) => (
    <li
      key={tabIdx}
      onClick={this.setActiveTab}
      data-panel-idx={panelIdx}
      data-tab-idx={tabIdx}
      className={tab.active ? 'active' : ''}
    >
      {tab.title}
    </li>
  );

  render() {
    const { active, panels } = this.props;

    return (
      <div id="sidebar" className={active ? 'active' : ''}>
        <span onClick={this.toggleSidebar} className="toggleSidebar" />

        {!active && (
          <ul className="tabs-rotated">
            {panels.map((panel, panelIdx) =>
              panel.map((tab, tabIdx) => this.tabTitle(tab, panelIdx, tabIdx))
            )}
          </ul>
        )}

        {active &&
          panels.map((panel, panelIdx) => (
            <div className="panel" key={panelIdx}>
              <ul className="tabs">
                {panel.map((tab, tabIdx) =>
                  this.tabTitle(tab, panelIdx, tabIdx)
                )}
              </ul>

              {panel.map((tab, idx) => {
                if (tab.active) {
                  let component;
                  switch (tab.component) {
                    case 'PanelActiveEntities':
                      component = <ActiveEntities />;
                      break;
                    case 'PanelSnapshots':
                      component = <PanelSnapshots />;
                      break;
                    case 'PanelLayers':
                      component = <PanelLayers />;
                      break;
                    case 'PanelObjects':
                      component = <PanelObjects />;
                      break;
                    case 'PanelEdit':
                      component = <PanelEdit />;
                      break;
                    case 'PanelInfo':
                      component = <PanelInfo />;
                      break;
                    default:
                      component = `[COMPONENT "${tab.component}" NOT FOUND]`;
                      console.error(component);
                  }

                  return (
                    <div className="panel-content" key={idx}>
                      {component}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}

        {this.props.children}
      </div>
    );
  }

  static propTypes = {
    active: PropTypes.bool.isRequired,
    panels: PropTypes.array,
    editor: PropTypes.object,
    toggleSidebar: PropTypes.func.isRequired,
    toggleTab: PropTypes.func.isRequired,
    children: PropTypes.node
  };
}
