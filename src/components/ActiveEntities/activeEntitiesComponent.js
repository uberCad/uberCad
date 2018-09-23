import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import PropTypes from 'prop-types'
import './ActiveEntities.css'

export default class ActiveEntitiesComponent extends Component {
  onChangeVisible = (event) => {
    event.stopPropagation()
    let {currentTarget: {checked, dataset: {idx}}} = event
    this.props.toggleVisible(this.props.editor.activeEntities[idx], checked, this.props.editor)
  }

  unSelect = (event) => {
    event.stopPropagation()
    let {currentTarget: {dataset: {idx}}} = event
    this.props.unSelect(idx, this.props.editor.activeEntities, this.props.editor)
  }

  shouldComponentUpdate (nextProps) {
    return this.props.editor.activeEntities !== nextProps.editor.activeEntities ||
      this.props.editor.activeLine !== nextProps.editor.activeLine
  }

  selectEntity = ({currentTarget: {dataset: {idx}}}) => {
    this.props.selectEntity(idx, this.props.editor.activeEntities, this.props.editor)
  }

  stopPropagation = event => {
    event.stopPropagation()
  }

  groupEntities = () => {
    this.props.groupEntities(this.props.editor)
  }

  showAll = () => {
    this.props.showAll(this.props.editor)
  }

  editLine = () => {
    if (this.props.editor.activeLine.parent.parent.name === 'Objects') {
      this.props.isEdit(true, this.props.editor, this.props.editor.activeLine.parent)
    } else {
      this.props.isEdit(true, this.props.editor, this.props.editor.activeLine)
    }
  }

  render () {
    console.debug('render:', this)
    const {activeEntities, activeLine} = this.props.editor
    return (
      <div id='activeEntities'>
        <div className='content'>
          {activeEntities.length
            ? activeEntities.map((entity, idx) => (
              <div className={`item ${activeLine === entity ? 'active' : ''}`}
                   key={idx}
                   data-idx={idx}
                   onClick={this.selectEntity}
              >
                id: {entity.id} parent: {entity.parent.name}

                <button className='un-select' data-idx={idx}
                        onClick={this.unSelect}
                />

                <FormattedMessage id='activeEntities.checkboxVisibility' defaultMessage='Visibility'>
                  {title =>
                    <input type='checkbox' data-idx={idx}
                           title={title}
                           checked={entity.visible}
                           onChange={this.onChangeVisible}
                           onClick={this.stopPropagation}
                    />
                  }
                </FormattedMessage>
              </div>
            ))
            : (
              <FormattedMessage id='activeEntities.noEntities' defaultMessage='No active entities'/>
            )
          }
        </div>
        <div className='toolbar'>
          {activeEntities.length > 1 && (
            <FormattedMessage id='activeEntities.group' defaultMessage='Group'>
              {title =>
                <button onClick={this.groupEntities}
                        className='group'
                        title={title}
                />
              }
            </FormattedMessage>
          )}
          <FormattedMessage id='activeEntities.show' defaultMessage='Show'>
            {title =>
              <button onClick={this.showAll}
                      className='show-all'
                      title={title}
              />
            }
          </FormattedMessage>

          {activeLine && <button className='edit-line' onClick={this.editLine} title='Edit line'/>}
        </div>
      </div>
    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    editor: PropTypes.shape({
      activeEntities: PropTypes.array.isRequired,
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object,
      cadCanvas: PropTypes.object,
      options: PropTypes.object,
      isEdit: PropTypes.bool,
      activeLine: PropTypes.object
    })
  }
}
