const { run } = require("../index.js");

let EXPECTED_MEAN = 150;
let EPSILON = 10;
const _RESET = '\x1b[0m';
const _CYAN = '\x1b[36m';
const _GREEN = '\x1b[32m';
const _RED = '\x1b[31m';

function myUrlBuilder(){
    var url = "http://localhost:3000/api/v1/stress/"+EXPECTED_MEAN;
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
        
    if(mean > EXPECTED_MEAN + EPSILON || mean < EXPECTED_MEAN - EPSILON){
        console.log(`${_RED}ERROR${_RESET} --> Expected mean of ${_CYAN}${EXPECTED_MEAN}ms${_RESET}, but got ${_CYAN}${mean}ms${_RESET}`);
        process.exit(1);
    }else{
        console.log(`${_GREEN}SUCCESS${_RESET} --> Expected mean: ${_CYAN}${EXPECTED_MEAN}ms${_RESET}, real mean: ${_CYAN}${mean}ms${_RESET}`);
        process.exit(0);
    }
}

run({
    concurrentUsers : 2,
    iterations : 3,
    delay : 500,
    verbose : true,
    consoleLogging : true, //Comment this line to avoid logs
    urlBuilder: myUrlBuilder,
    requestBuilder : myRequestBuilder,
    resultsHandler : myResultsHandler,
    responseHandler : (responseInfo) => {       
        console.log(JSON.stringify(responseInfo,null,2));
    }
});

