const { json } = require("express");
const { run } = require("../index.js");

let CONCURRENT_USERS = 1;
let ITERATIONS = 4; 
let DELAY = 150;
let TIMEOUT = 300;

let EXPECTED_MEAN = 150;
let EPSILON = 15;
const _RESET = '\x1b[0m';
const _CYAN = '\x1b[36m';
const _GREEN = '\x1b[32m';
const _RED = '\x1b[31m';
const _YELLOW = '\x1b[33m';

function myUrlBuilder(user,iteration){

    var url = "http://localhost:3000/api/v1/stress/"+EXPECTED_MEAN;
    
    if(iteration === 4)
        url = "http://localhost:3000/api/v1/stress/"+(TIMEOUT+100);

    return url;
}

function myRequestBuilder(userId){
    var data = {
        user : userId
    };

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
    let mean = results.summary.mean;

    if(results.lotStats[3].result.stats[0].timeout){
        console.log(`Last iteration was expected to timeout --> ${_GREEN}SUCCESS${_RESET}`);
    }else{
        console.log(`Last iteration was expected to timeout but it didn't --> ${_RED}FAILED${_RESET} stats=${JSON.stringify(results.lotStats[3].result.stats[0],null,2)}`); 
        process.exit(1);
    }

    if(mean > EXPECTED_MEAN + EPSILON || mean < EXPECTED_MEAN - EPSILON){
        console.log(`Expected mean of ${_YELLOW}${EXPECTED_MEAN}ms${_RESET} ±${_YELLOW}${EPSILON}${_RESET}, but got ${_YELLOW}${mean}ms${_RESET} --> ${_RED}FAILED${_RESET}`);
        process.exit(1);
    }else{
        console.log(`Expected mean: ${_YELLOW}${EXPECTED_MEAN}ms${_RESET} ±${_YELLOW}${EPSILON}${_RESET}, real mean: ${_YELLOW}${mean}ms${_RESET} --> ${_GREEN}SUCCESS${_RESET}`);
    }
    
    
    process.exit(0);
    
}

run({
    concurrentUsers : CONCURRENT_USERS,
    iterations : ITERATIONS,
    delay : DELAY,
    timeout: TIMEOUT,
    verbose : true,
    consoleLogging : true, //Comment this line to avoid logs
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    resultsHandler : myResultsHandler,
    responseHandler : (responseInfo) => {       
        console.log(JSON.stringify(responseInfo,null,2));
    }
});

