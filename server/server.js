"use strict"

const DEBUG = true;
const WebSocketServer = require("ws").Server
const wss = new WebSocketServer({ port: 8081 })
var statistics = { connectionId: 0, connectionCount: 0 }

const availableModules = {
  lib: require("./lib")
}

wss.on("connection", ws => {
  // Use function closure to implement session
  let session = { on: ws.on, id: statistics.connectionId }
  statistics.connectionId += 1
  statistics.connectionCount += 1
  ws.on("message", data => {
    try {
      if (DEBUG) console.log("[Receive] " + data)
      data = JSON.parse(data)
      /**
       * Sanity check, A valid message structure looks like this:
       *    {
       *      "module": String,
       *      "function": String,
       *      "arguments": [
       *        { type: "object", object: {} },
       *        { type: "function", function: 12321 }
       *      ]
       *    }
       * Or
       *    {
       *      "action": "listFunctions",
       *      "module": String
       *    }
       */
      let moduleName = data.module.toString();
      if (!availableModules[moduleName]) {
        throw `No such module ${moduleName}`
      }
      if (data.action == "listFunctions") {
        wsSend(listFunctions(moduleName))
      } else {
        callFunction(moduleName, data.function.toString(), data.arguments, session, wsSend)
      }
    } catch (e) {
      wsSend({ error: e.toString() })
    }
  })
  ws.on("close", () => {
    // Manually GC
    Object.keys(session, k => delete session[k])
    statistics.connectionCount -= 1
  })
  function wsSend(obj) {
    if (DEBUG) console.log("[Send] " + JSON.stringify(obj))
    if (ws.readyState == 1) {
      ws.send(JSON.stringify(obj))
    }
  }
})

/**
 * List functions in a module, send
 *    {
 *      "action": "listFunctions",
 *      "module": String,
 *      "functions": [String]
 *    }
 */
function listFunctions(moduleName) {
  return {
    action: "listFunctions",
    module: moduleName,
    functions: Object.keys(availableModules[moduleName])
  }
}

function callFunction(moduleName, funcName, args, session, wsSend) {
  let func = availableModules[moduleName][funcName]
  if (typeof func != "function") {
    throw `No such function ${funcName}`
  }
  if (func.length != args.length) {
    throw `Function receives ${func.length} arguments, but provided ${args.length}`
  }
  // Prepare the arguments
  args = args.map(arg => {
    if (arg.type == "object") {
      // { type: "object", object: {} }
      return arg.object
    } else if (arg.type == "function") {
      // { type: "function", function: 12321 }
      return function() {
        /*
         *    {
         *      "function": Integer,
         *      "arguments": [
         *        { type: "object", object: {} }
         *      ]
         *    }
         */
        wsSend({
          function: arg.function,
          arguments: Array.prototype.slice.call(arguments)
        })
      }
    } else {
      throw `Unknow argument ${arg}`
    }
  })
  func.apply(session, args)
}
