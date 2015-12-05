var subscribers = []

setInterval(() => {
  subscribers.forEach(subscriber => {
    subscriber("ping")
  })
}, 1000)

module.exports = {
  add(a, b, callback) {
    callback(a + b + 42)
  },
  subscribe(callback) {
    console.log("Register")
    subscribers.push(callback)
    this.on("close", () => {
      console.log("Unregister")
      subscribers.splice(subscribers.indexOf(callback))
    })
  },
  login(callback) {
    this.user = "Leedy"
    callback()
  },
  getUser(callback) {
    callback(this.user)
  }
}
