var funcList = []
var moduleObjects = {}
var listFunctionsResolves = {}

var ws = window.ws = new WebSocket("ws://localhost:8081")
var wsPromise = new Promise(resolve => ws.onopen = resolve)

ws.onclose = () => {
  console.error("Remote server closes unexpectly")
}

ws.onmessage = ({ data }) => {
  console.log("[Recive] " + data)
  data = JSON.parse(data)
  if (data.error) {
    /**
     *    {
     *      "error": "Invalid"
     *    }
     */
    console.error(data.error)
  }
  if (data.action == "listFunctions") {
    /**
     *    {
     *      "action": "listFunctions",
     *      "module": String,
     *      "functions": [String]
     *    }
     */
    moduleObjects[data.module] = makeModuleObject(data.module, data.functions)
    listFunctionsResolves[data.module](moduleObjects[data.module])
  }
  if (typeof data.function == "number") {
    /**
     *    {
     *      "function": Integer,
     *      "arguments": [1, 2, 3]
     *    }
     */
    funcList[data.function].apply(null, data.arguments)
  }
}

window.requireRemote = function() {
  var callback = arguments[arguments.length - 1]
  var moduleNames = Array.prototype.slice.call(arguments, 0, arguments.length - 1)
  Promise.all(moduleNames.map(requireOne)).then(values => callback.apply(this, values))
}

function wsSend(object) {
  console.log("[Send] " + JSON.stringify(object))
  wsPromise.then(() => ws.send(JSON.stringify(object)))
}

function makeModuleObject(moduleName, funcNames) {
  var obj = {}
  funcNames.forEach(funcName => {
    obj[funcName] = function() {
      /**
       * Send
       *    {
       *      "module": String,
       *      "function": String,
       *      "arguments": [
       *        { type: "object", object: {} },
       *        { type: "function", function: 12321 }
       *      ]
       *    }
       */
      let args = Array.prototype.map.call(arguments, arg => {
        if (typeof arg == "function") {
          funcList.push(arg)
          return { type: "function", function: funcList.length - 1 }
        } else {
          return { type: "object", object: arg }
        }
      })
      wsSend({
        module: moduleName,
        function: funcName,
        arguments: args
      })
    }
  })
  return obj
}

/**
 * Send
 * {
 *   "action": "listFunctions",
 *   "module": String
 * }
 */
function requireOne(moduleName) {
  if (moduleObjects[moduleName]) { // already loaded
    return Promise.resolve(moduleObjects[moduleName])
  }
  wsSend({
    action: "listFunctions",
    module: moduleName
  })
  return new Promise(resolve => listFunctionsResolves[moduleName] = resolve)
}
