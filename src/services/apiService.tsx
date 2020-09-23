import axios from 'axios';

import UserService from './UserService';

import { API_HOST } from '../config';

axios.defaults.baseURL = API_HOST;
if (window && window.localStorage.token) {
  axios.defaults.headers.Authorization = 'bearer ' + window.localStorage.token;
}
interface IRequestOptions {
  headers?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

interface IServerResponse {
  [key: string]: Record<string, unknown>;
}

export default class ApiService {
  static get(url: string): Promise<IServerResponse | void> {
    return axios
      .get(`${url}`)
      .then(response => response.data)
      .catch(error => {
        if (error.response && error.response.status === 401) {
          UserService.logout();
        }
        throw new Error(error);
      });
  }

  static post(
    url: string,
    options: IRequestOptions
  ): Promise<IServerResponse | void> {
    options = options || {};
    options.headers = options.headers || {};
    options.data = options.data || {};

    return axios
      .post(`${url}`, options.data, { headers: options.headers })
      .then(response => response.data)
      .catch(error => {
        if (error.response && error.response.status === 401) {
          UserService.logout();
        }
        throw new Error(error);
      });
  }

  static put(
    url: string,
    options: IRequestOptions
  ): Promise<IServerResponse | void> {
    options = options || {};
    options.data = options.data || {};

    return axios
      .put(`${url}`, options.data)
      .then(response => response.data)
      .catch(error => {
        if (error.response && error.response.status === 401) {
          UserService.logout();
        }
        throw new Error(error);
      });
  }

  static delete(url: string): Promise<IServerResponse | void> {
    return axios
      .delete(`${url}`)
      .then(response => response.data)
      .catch(error => {
        if (error.response && error.response.status === 401) {
          UserService.logout();
        }
        throw new Error(error);
      });
  }
}
