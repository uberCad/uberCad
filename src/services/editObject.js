let setColor = function (entity, bgColor, objName, objColor) {
  entity.children.forEach(function (entity) {
    if (entity.children.length > 0) {
      setColor(entity, bgColor, objName, objColor)
    } else {
      if (entity.type === 'Line' && entity.children.length === 0) {
        if (entity.parent.name === objName) {
          if (!entity.userData.originalColor) {
            entity.userData.originalColor = entity.material.color.clone()
          }
          entity.material.color.set(objColor)
        } else {
          if (!entity.userData.originalColor) {
            entity.userData.originalColor = entity.material.color.clone()
          }
          entity.material.color.set(bgColor)
        }
      }
    }
  })
}

let setOriginalColor = (entity) => {
  let firstColor; //set color first line for created new line, arc
  entity.children.forEach(function (entity) {
    if (entity.children.length > 0) {
      setOriginalColor(entity)
    } else {
      if (entity.type === 'Line' &&
        entity.children.length === 0) {
        if (entity.userData.originalColor) {
          firstColor = firstColor ? firstColor : entity.userData.originalColor;
          entity.material.color.set(entity.userData.originalColor);
        } else {
          entity.material.color.set(firstColor);
        }
      }
    }
  })
}

export {
  setColor,
  setOriginalColor
}
