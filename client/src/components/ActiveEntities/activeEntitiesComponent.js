import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './ActiveEntities.css'

export default class ActiveEntitiesComponent extends Component {
  onChangeVisible = (event) => {
    event.stopPropagation()
    let {currentTarget: {checked, dataset: {idx}}} = event;
    this.props.toggleVisible(this.props.editor.activeEntities[idx], checked, this.props.editor)
  }

  unSelect = (event) => {
    event.stopPropagation();
    let {currentTarget: {dataset: {idx}}} = event;
    this.props.unSelect(idx, this.props.editor.activeEntities, this.props.editor)
  }

  shouldComponentUpdate (nextProps) {
    return this.props.editor.activeEntities !== nextProps.editor.activeEntities
  }

  selectEntity = ({currentTarget: {dataset: {idx}}}) => {
    this.props.selectEntity(idx, this.props.editor.activeEntities, this.props.editor)
  }

  stopPropagation = event => {
    event.stopPropagation();
  }

  groupEntities = () => {
    this.props.groupEntities(this.props.editor)

  }

  showAll = () => {
    this.props.showAll(this.props.editor)
  }

  render () {
    console.debug('render:', this)
    const {activeEntities} = this.props.editor
    return (
      <div id='activeEntities'>
        <div className='content'>
          {activeEntities.length
            ? activeEntities.map((entity, idx) => (
              <div className='item'
                   key={idx}
                   data-idx={idx}
                   onClick={this.selectEntity}
              >
                id: {entity.id} parent: {entity.parent.name}

                <button className='un-select' data-idx={idx}
                        onClick={this.unSelect}
                />
                <input type='checkbox' data-idx={idx}
                       title='Visibility'
                       checked={entity.visible}
                       onChange={this.onChangeVisible}
                       onClick={this.stopPropagation}
                />
              </div>
            ))
            : (
              <span>No active entities</span>
            )
          }
        </div>
        <div className='toolbar'>
          {activeEntities.length > 1 && (
            <button onClick={this.groupEntities}
                    className="group"
                    title="Group to object"
            />
          )}
          <button onClick={this.showAll}
                  className="show-all"
                  title="Show all"
          />
        </div>
      </div>
    )
  }

  static propTypes = {
    editor: PropTypes.shape({
      activeEntities: PropTypes.array.isRequired,
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object,
    })
  }
}
