import api from './apiService';
import axios from 'axios';
import history from '../config/history';

export default class UserService {
  static isAuthenticated() {
    return !!window.localStorage.token;
  }
  static updateToken(token) {
    axios.defaults.headers.Authorization = 'bearer ' + token;
    window.localStorage.setItem('token', token);
  }

  static login(username, password) {
    return api
      .post(`/auth/login`, {
        data: { username, password }
      })
      .then(res => {
        this.updateToken(res.token);
        return res;
      })
      .catch(error => {
        if (error.response && error.response.status === 401) {
          return `User name or password is incorrect`;
        } else {
          return error.message;
        }
      });
  }

  static logout() {
    return new Promise(function(resolve, reject) {
      api
        .post('/auth/logout')
        .then(res => {
          window.localStorage.clear();
          axios.defaults.headers.common['X-Session-Id'] = '';
          resolve(res);
          history.push(`${process.env.PUBLIC_URL}/login`);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  static changePassword(currentPassword, newPassword) {
    let that = this;
    return new Promise((resolve, reject) => {
      let user = JSON.parse(window.localStorage.user);
      console.log('user local', user);
      that
        .login(user.email, currentPassword)
        .then(() => {
          user.password = newPassword;
          that
            .editUser(user)
            .then(res => {
              resolve(res);
            })
            .catch(error => {
              reject(error);
            });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  static createUser(user) {
    return api
      .post('/auth/signup', {
        data: user
      })
      .then(res => {
        console.log('register res = ', res);
        window.localStorage.setItem('token', res.token);
        axios.defaults.headers.Authorization = 'bearer ' + res.token;
        return res;
      })
      .catch(error => {
        console.log({ ...error });
        if (
          error.response &&
          error.response.data &&
          error.response.data.errorMessage
        ) {
          return error.response.data.errorMessage;
        } else {
          return error.message;
        }
      });
  }

  static getUsersList() {
    return new Promise((resolve, reject) => {
      api
        .get('/users')
        .then(res => {
          resolve(res);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  static getUsersByPage(pageSize, page, query) {
    return new Promise((resolve, reject) => {
      api
        .get(`/users?page_size=${pageSize}&page=${page}&query=${query}`)
        .then(res => {
          resolve(res);
        })
        .catch(error => {
          console.log(error);
          reject(error);
        });
    });
  }

  static searchUsersByPage(pageSize, page, query) {
    return new Promise((resolve, reject) => {
      api
        .get(`/users/search?q=${query}&page_size=${pageSize}&page=${page}`)
        .then(res => {
          resolve(res);
        })
        .catch(error => {
          console.log(error);
          reject(error);
        });
    });
  }

  static editUser(user) {
    return new Promise((resolve, reject) => {
      let data = { first_name: user.first_name, email: user.email };
      if (user.password) {
        data.password = user.password;
      }
      if (user.phone) {
        data.phone = user.phone;
      }
      if (user.last_name) {
        data.last_name = user.last_name;
      }
      api
        .put(`/users/${user.id}`, { data: data })
        .then(res => {
          if (typeof user.tags === 'object') {
            let tags = '';
            user.tags.forEach(tag => {
              tags += `${tag.value},`;
            });
            api
              .put(`/users/${res.user.id}/tags/${tags}`)
              .then(res => {
                resolve(res);
              })
              .catch(error => {
                reject(error);
              });
          } else if (user.tags) {
            api
              .put(`/users/${res.user.id}/tags/${user.tags}`)
              .then(res => {
                resolve(res);
              })
              .catch(error => {
                reject(error);
              });
          } else {
            api
              .put(`/users/${res.user.id}/tags`)
              .then(res => {
                resolve(res);
              })
              .catch(error => {
                reject(error);
              });
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  static deleteUser(user) {
    return new Promise((resolve, reject) => {
      api
        .delete(`/super/users/${user.id}`)
        .then(res => {
          resolve(res);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
