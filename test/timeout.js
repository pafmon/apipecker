const { run } = require("../index.js");

let CONCURRENT_USERS = 4;
let ITERATIONS = 5; 
let DELAY = 50;

let TIMEOUT = 500;

let INITIAL = 200;
let STEP = 30;
var timeSetup= INITIAL;

let EXPECTED_TIMEOUTS = 11;
let EXPECTED_MEAN = 360;
let EPSILON = 15;
const _RESET = '\x1b[0m';
const _CYAN = '\x1b[36m';
const _GREEN = '\x1b[32m';
const _RED = '\x1b[31m';
const _YELLOW = '\x1b[33m';
const _MAGENTA = '\x1b[35m';

function myUrlBuilder(user,iteration){
    var url = "http://localhost:3000/api/v1/stress/"+timeSetup;
    console.log(`${_MAGENTA} Hey, I'm the urlBuilder, and I'm building the url ${url} for user ${user} and iteration ${iteration}${_RESET}`);
    timeSetup = timeSetup + STEP;
    return url;
}

function myRequestBuilder(userId, iteration){
    var data = {
        user : userId
    };
    console.log(`${_MAGENTA} Hey, I'm the requestBuilder, and I'm building the request for user ${userId} and iteration ${iteration}${_RESET}`);    
    var jsonData = JSON.stringify(data);

    var requestConfig = {
        options : {
            method: "GET",
            headers: {
                'Api-Token': 'TOKEN-'+userId,
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            }
        },
        data : jsonData
    }

    return requestConfig;
}

function myResultsHandler(results){
   
    console.log(`${_MAGENTA} Hey, I'm the resultsHandler, and I'm handling the results:\n ${JSON.stringify(results,null,2)}${_RESET}`);    
    
    let mean = results.summary.mean;
    
    if(mean > EXPECTED_MEAN + EPSILON || mean < EXPECTED_MEAN - EPSILON){
        console.log(`${_RED}ERROR${_RESET} --> Expected mean of ${_YELLOW}${EXPECTED_MEAN}ms${_RESET} ±${_YELLOW}${EPSILON}${_RESET}, but got ${_YELLOW}${mean}ms${_RESET}`);
        process.exit(1);
    }else{
        console.log(`${_GREEN}SUCCESS${_RESET} --> Expected mean: ${_YELLOW}${EXPECTED_MEAN}ms${_RESET} ±${_YELLOW}${EPSILON}${_RESET}, real mean: ${_YELLOW}${mean}ms${_RESET}`);
    }

    if(results.summary.timeoutCount != 11){
        console.log(`${_RED}ERROR${_RESET} --> Expected ${_YELLOW}${EXPECTED_TIMEOUTS}${_RESET} timeouts, but got ${_YELLOW}${results.summary.timeoutCount}${_RESET}`);
        process.exit(1);
    }else{    
        console.log(`${_GREEN}SUCCESS${_RESET} --> Expected ${_YELLOW}${EXPECTED_TIMEOUTS}${_RESET} timeouts, real count: ${_YELLOW}${results.summary.timeoutCount}${_RESET}`);
    }   
    
    process.exit(0);

}

run({
    concurrentUsers : CONCURRENT_USERS,
    iterations : ITERATIONS,
    delay : DELAY,
    verbose : true,
    consoleLogging : true,
    harvestResponse : true, //Comment this line to avoid logs
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    resultsHandler : myResultsHandler,
    timeout: TIMEOUT
});

