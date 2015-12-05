require("./client")

requireRemote("lib", (lib) => {
  lib.add(1, 2, res => {
    document.write("<p>" + res + "</p>")
  })
  lib.login(() => {
    lib.getUser(user => {
      document.write("<p>" + user + "</p>")
    })
  })
  lib.subscribe(info => {
    document.write("<p>" + info + "</p>")
  })
})
