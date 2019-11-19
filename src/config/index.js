// export default const API_HOST = `http://10.0.4.183:8800/api/`
// export const API_HOST = `/api/`
// export const API_HOST = `https://uber-cad.ml/_db/cad/`
// export const API_HOST = `https://arangodb.aditim.ru/_db/cad/`
// export const API_HOST = `http://localhost:8529/_db/cad/`
export const API_HOST = process.env.REACT_APP_ARANGODB_HOST || `https://db.ubercad.pp.ua/_db/cad/`;
export const appName = `uberCad`
