export const increment = () => {
    console.log('increment = ()')
    return {
        type: 'INCREMENT'
    }
}

export const decrement = () => {
    console.log('decrement = ()')
    return {
        type: 'DECREMENT'
    }
}