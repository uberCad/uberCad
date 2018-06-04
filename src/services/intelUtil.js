export function flattenMessages (nestedMessages, prefix = '') {
  console.log('nestedMessages', nestedMessages)
  return Object.keys(nestedMessages).reduce((messages, key) => {
    let value = nestedMessages[key]
    let prefixedKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      messages[prefixedKey] = value
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey))
    }
    console.log('Messages', messages)
    return messages
  }, {})
}
