#!/usr/bin/env node
const { run } = require("./src");

module.exports = { run };

if (require.main === module) {
    // Command Prompt invocation...
  
    if (process.argv.length <6) {
        console.log("Use apipecker <concurrentUsers> <iterations> <delay in ms> <url> [-v]\nLast parameter enables the VERBOSE mode.");
        console.log("Example: apipecker 2 3 500 http://knapsack-api.herokuapp.com/api/v1/stress/10000/10 -v");
        process.exit();
    }

    var config ={
        concurrentUsers : process.argv[2],
        iterations : process.argv[3],
        delay : process.argv[4],
        url : process.argv[5],
        verbose : (process.argv[6] == "-v"),
        method: "GET",
        consoleLogging : true
    };

    run(config);
}

