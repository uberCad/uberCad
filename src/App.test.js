import React from 'react';
import App from './App';
import { Provider } from 'react-redux';
import { configure, shallow, mount, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import {appName} from "./config";

describe('>>>H O M E --- REACT-REDUX (Shallow + passing the {store} directly)',()=>{
    const mockStore = configureStore();
    let store,wrapper;

    let initialState = {
        // counter,
        projectsByFilter: {
            all: {
                loading: false,
                didInvalidate: false,
                items: [
                    {
                        title: "Some project"
                    }
                ],
                error: null,
                lastUpdated: null,
                sortUp: true,
                sortFieldName: ''
            }
        },
        // projects: {
        //     loading: false,
        //     didInvalidate: false,
        //     items: [],
        //     error: null,
        //     lastUpdated: null,
        //     sortUp: true,
        //     sortFieldName: ''
        // },

        projectsFilter: "all",
        project: null,
        spinner: {
            active: false
        },
        // cad,
        // toolbar,
        // options,
        // selection,
        // sidebar,
        userLogin: {
            token: '',
            username: '',
            pictureUrl: ''
        },
        // materials,
        // price,
        locale: {
            lang: 'en'
        },
        modal: {
            show: false,
            message: '',
            title: '',
            link: ''
        },
        // order,
        // tools
    };

    configure({ adapter: new Adapter() });

    beforeEach(()=>{
        store = mockStore(initialState);
        wrapper = mount( <Provider store={store}><App lang="en" /></Provider> );
    });

    it('+++ render the connected(SMART) component', () => {
        expect(wrapper.length).toEqual(1)
    });

    it('+++ check Prop matches with initialState', () => {
        expect(wrapper.text().includes(appName)).toEqual(true)
    });
});