# ws-rpc: RPC over WebSocket

How to run

1. `cd server`
  1. `npm install`
  2. `npm start` / Or `nodemon`
2. `cd client`
  1. `npm install webpack-dev-server -g`
  2. `npm install --dev`
  3. `webpack-dev-server --inline` to start the server.
3. Visit http://localhost:8080.
4. Make some modifications to `client/entry.js` and `server/lib.js`.
