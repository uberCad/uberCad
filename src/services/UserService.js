import api from './apiService'
import axios from 'axios'

export default class UserService {
  static isAuthenticated () {
    return !!window.localStorage.userToken
  }

  static login (login, password) {
    let headers = {}
    headers['Authorization'] = 'Basic ' + window.btoa(login + ':' + password)

    return new Promise(function (resolve, reject) {
      api.post('users/login', { headers: headers })
        .then((res) => {
          axios.defaults.headers.common['x-code'] = res.user.token
          window.localStorage.userToken = JSON.stringify(res.user.token)
          window.localStorage.user = JSON.stringify(res.user)
          resolve(res.user)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static logout () {
    window.localStorage.clear()
    axios.defaults.headers.common['x-code'] = null
  }

  static changePassword (currentPassword, newPassword) {
    let that = this
    return new Promise((resolve, reject) => {
      let user = JSON.parse(window.localStorage.user)
      console.log('user local', user)
      that.login(user.email, currentPassword)
        .then((res) => {
          user.password = newPassword
          that.editUser(user)
            .then((res) => {
              resolve(res)
            })
            .catch((error) => {
              reject(error)
            })
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static createUser (user) {
    return new Promise((resolve, reject) => {
      user.roles = ['ROLE_USER']
      api.post('/super/users', {
        data: user
      })
        .then((res) => {
          api.put(`/users/${res.user.id}/tags/${user.tags}`)
            .then((res) => {
              resolve()
            })
            .catch((error) => {
              reject(error)
            })
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static getUsersList () {
    return new Promise((resolve, reject) => {
      api.get('/users').then((res) => {
        resolve(res)
      })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static getUsersByPage (pageSize, page, query) {
    return new Promise((resolve, reject) => {
      api.get(`/users?page_size=${pageSize}&page=${page}&query=${query}`).then((res) => {
        resolve(res)
      })
        .catch((error) => {
          console.log(error)
          reject(error)
        })
    })
  }

  static searchUsersByPage (pageSize, page, query) {
    return new Promise((resolve, reject) => {
      api.get(`/users/search?q=${query}&page_size=${pageSize}&page=${page}`).then((res) => {
        resolve(res)
      })
        .catch((error) => {
          console.log(error)
          reject(error)
        })
    })
  }

  static editUser (user) {
    return new Promise((resolve, reject) => {
      let data = { first_name: user.first_name, email: user.email }
      if (user.password) {
        data.password = user.password
      }
      if (user.phone) {
        data.phone = user.phone
      }
      if (user.last_name) {
        data.last_name = user.last_name
      }
      api.put(`/users/${user.id}`, { data: data })
        .then((res) => {
          if (typeof user.tags === 'object') {
            let tags = ''
            user.tags.forEach((tag) => {
              tags += `${tag.value},`
            })
            api.put(`/users/${res.user.id}/tags/${tags}`)
              .then((res) => {
                resolve(res)
              })
              .catch((error) => {
                reject(error)
              })
          } else if (user.tags) {
            api.put(`/users/${res.user.id}/tags/${user.tags}`)
              .then((res) => {
                resolve(res)
              })
              .catch((error) => {
                reject(error)
              })
          } else {
            api.put(`/users/${res.user.id}/tags`)
              .then((res) => {
                resolve(res)
              })
              .catch((error) => {
                reject(error)
              })
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static deleteUser (user) {
    return new Promise((resolve, reject) => {
      api.delete(`/super/users/${user.id}`)
        .then((res) => {
          resolve(res)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  static capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}
