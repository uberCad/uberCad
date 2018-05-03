import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './ActiveEntities.css'

export default class ActiveEntitiesComponent extends Component {
  onChangeVisible = ({currentTarget: {checked, dataset: {idx}}}) => {
    this.props.toggleVisible(this.props.activeEntities[idx], checked, this.props.editor)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.activeEntities !== nextProps.activeEntities
  }

  render () {
    console.debug('render:', this)
    const {activeEntities} = this.props
    return (
      <div id='activeEntities'>
        <div className='tabTitle'>Active entities</div>
        {activeEntities.map((entity, idx) => (
          <div className='active-entity' key={idx}>
            id: {entity.id} parent: {entity.parent.name}
            <input type='checkbox' data-idx={idx}
                   checked={entity.visible}
                   onChange={this.onChangeVisible}
            />
            {/*{JSON.stringify(entity)}*/}
          </div>
        ))}
      </div>
    )
  }

  static propTypes = {
    activeEntities: PropTypes.array.isRequired
  }
}
