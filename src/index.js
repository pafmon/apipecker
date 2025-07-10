const http = require('http');
const https = require('https');

const urlParser = require('url');

var DEBUG=false;

const {
    promiseParallel
} = require('./utils/promise');
const {
    getBegin,
    getDuration
} = require('./utils/time');
const {
    min,
    max,
    mean,
    std,
    round
} = require('./utils/math');
const { error, time } = require('console');


const _RESET = '\x1b[0m';
const _GREEN = '\x1b[32m';
const _CYAN = '\x1b[36m';
const _YELLOW = '\x1b[33m';
const _RED = '\x1b[31m';
const _MAGENTA = '\x1b[35m';

var logs = [];
var consoleLogging = false;

function log(s){
    logs.push(s);
    if(consoleLogging)
        console.log(s);
};

function dbg(s){
    if (DEBUG)
        console.log(`${_MAGENTA}${s}${_RESET}`);
}

function run(config){

    const concurrentUsers = config.concurrentUsers;
    const iterations = config.iterations;
    const delay = config.delay;
    var  url = config.url;
    const verbose = config.verbose;
    const method = config.method;
    consoleLogging = config.consoleLogging;
    const harvestResponse = config.harvestResponse || false;

    const urlBuilder = config.urlBuilder;
    const requestBuilder = config.requestBuilder;
    const responseHandler = config.responseHandler;
    const resultsHandler = config.resultsHandler;
    const timeout = config.timeout || null;
    DEBUG = DEBUG || config.debug;
    
     
    try{
        
        if(urlBuilder)
            url = urlBuilder("user1",1);  
        else if(url == null || url == "" || url == undefined){
            throw new Error(`${_RED}URL is undefined <${url}> and urlBuilder is not specified${_RESET}`);
            return;
        }
    
        var protocol = urlParser.parse(url, true).protocol.slice(0,-1);

    }catch(err){
        throw new Error(`${_RED}Invalid URL <${url}> : ${err}${_RESET}`);
        return;
    }

    var requester;
    
    switch(protocol) {
        case "http":
          requester = http;
          break;
        case "https":
          requester = https;
          break;
        default:
          requester = http;
    }
    
    
    log(`Stress configuration:`);
    log(`  - Concurrent users: ${_CYAN}${concurrentUsers}${_RESET}`);
    log(`  - Iterations: ${_CYAN}${iterations}${_RESET}`);
    log(`  - Delay: ${_CYAN}${delay}${_RESET}`);
    if(timeout)
        log(`  - Timeout: ${_CYAN}${timeout}${_RESET}`);
    log(`  - URL: <${_CYAN}${url}${_RESET}>`);
    log(`  - Log mode: ${(verbose)?_CYAN+"VERBOSE"+_RESET:_CYAN+"normal"+_RESET}`);
    
    
    log("Starting execution...");
    
    function computeLotStats(rawStats) {
        let stats = rawStats.filter(s=>((s.error == null)||(s.error == "")||(s.error == undefined)));

        logLargeJSONStream('[computeLotStats] stats', stats, dbg);


        let lotStat =  {
            "stats": rawStats,
            "summary": {}
        }

        if(stats.length > 0)
            lotStat.summary = {
                "count": stats.length,
                "min": round(min(stats.map(s=>s.completeResponseTime)),3),
                "max": round(max(stats.map(s=>s.completeResponseTime)),3),
                "mean": round(mean(stats.map(s=>s.completeResponseTime)),3),
                "std": round(std(stats.map(s=>s.completeResponseTime)),3)
            };

        if(timeout){
            lotStat.summary.timeoutCount = 0;
            rawStats.forEach(stat =>{
                if(stat.timeout)
                    lotStat.summary.timeoutCount++;
            });
        }
            
        return lotStat;

    }
    
    
    function computeFullStats(lotStats) {
    
        var rawResponseTimes = [];
        
        lotStats.forEach(lotStat => {
            Array
            .prototype
            .push
            .apply(rawResponseTimes
                    ,lotStat
                        .result
                        .stats
                        .filter(s=>((s.error == null)||(s.error == "")||(s.error == undefined)))
                        .map(s=>s.completeResponseTime));
        });

        logLargeJSONStream('[computeFullStats] rawResponseTimes', rawResponseTimes, dbg);

        var responseTimes = rawResponseTimes.filter((n=>((n!=null && n>0))));

        var fullStats = {
            "lotStats": lotStats,
            "summary": {}
        };

        if(responseTimes.length > 0){
            fullStats.summary = {
                "count": responseTimes.length,
                "min": round(min(responseTimes),3),
                "max": round(max(responseTimes),3),
                "mean": round(mean(responseTimes),3),
                "std": round(std(responseTimes),3)
            };
        }

        if(timeout){
            fullStats.summary.timeoutCount = 0;

            lotStats.forEach(itStat =>{
                itStat.result.stats.forEach(stat =>{
                    if(stat.timeout){
                        fullStats.summary.timeoutCount++;
                    }
                });
            });
        }

        logLargeJSONStream('[computeFullStats] fullStats', fullStats, dbg);

        return fullStats;
    }
    
    
    function createRequestPromise(id, url) {
        return new Promise(function (resolve, reject) {
            var begin = getBegin();
            var iteration = initializedIterations;

            dbg(`[createRequestPromise][${id}][${iteration}][+${getDuration(begin)}] url=${url}, begin=${begin}`);
            var stats = {
                "id": id,
                "initialResponseTime": 0.0,
                "completeResponseTime": 0.0,
                "statusCode" : null
            };
            
            
            var options = {};

            options.method = method;
 
            var requestConfig = {}; 

            if(requestBuilder){
                requestConfig = requestBuilder(id,iteration);    
                options = requestConfig.options;
                if (!options.method)
                    options.method = method;
            }

            if (!options.method)
                options.method = "GET";
            let finalURL = url;
 
            try{
                if(urlBuilder)
                    finalURL = urlBuilder(id,iteration);  
                else if(finalURL == null || finalURL == "" || finalURL == undefined){
                    console.error(`${_RED}URL is undefined <${finalURL}> and urlBuilder is not specified${_RESET}`);
                    reject(id + ","+iteration+": " + err);
                }
                urlParser.parse(finalURL, true);

            }catch(err){
                console.error(`${_RED}Invalid URL <${url}> : ${err}${_RESET}`);
                reject(id + ","+iteration+": " + err);
            }


            if (verbose) log(`  - ${_CYAN}${id},it${iteration}${_RESET}: ${_CYAN}${options.method}${_RESET} Request to <${_CYAN}${finalURL}${_RESET}>...`);

            stats["url"] = finalURL;

            const req = requester.request(finalURL,options, (resp) => {             

                if(timeout && (getDuration(begin) > timeout)){
                    let now = getBegin();
                    if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}:${_RED} TIMEOUT!${_RESET}`);
                    dbg(`[createRequestPromise->requestTimout][${id}][${iteration}][+${getDuration(begin)}] begin=${begin}, now=${now}, duration=${((now-begin)/1000).toFixed(3)} > timeout=${timeout}`);  
                    stats["timeout"] = true;
                    resolve(stats);
                    return;
                }

                if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}: Status Code ${_YELLOW}${resp.statusCode}${_RESET}`);
                
                let data = '';
                
                stats["statusCode"] = resp.statusCode;

                stats["initialResponseTime"] = getDuration(begin);
                dbg(`[createRequestPromise->request][${id}][${iteration}][+${getDuration(begin)}] initialResponseTime=${stats["initialResponseTime"]}`);
                
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {

                    if(timeout && (getDuration(begin) > timeout)){
                        let now = getBegin();
                        if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}:${_RED} TIMEOUT!${_RESET}`);
                        dbg(`[createRequestPromise->request->onDataTimout][${id}][${iteration}][+${getDuration(begin)}] begin=${begin}, now=${now}, duration=${((now-begin)/1000).toFixed(3)} > timeout=${timeout}`);  
                        stats["timeout"] = true;
                        resolve(stats);
                        return;
                    }
                    
                    data += chunk;

                });
    
                // The whole response has been received. Print out the result.
                resp.on('end', () => {     
                    
                    if(timeout && (getDuration(begin) > timeout)){
                        let now = getBegin();
                        if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}:${_RED} TIMEOUT!${_RESET}`);
                        dbg(`[createRequestPromise->request->onEndTimout][${id}][${iteration}][+${getDuration(begin)}] begin=${begin}, now=${now}, duration=${((now-begin)/1000).toFixed(3)} > timeout=${timeout}`);  
                        stats["timeout"] = true;
                        resolve(stats);
                        return;
                    }
                    
                    now = getBegin();
                    dbg(`[createRequestPromise->request->onEnd][${id}][${iteration}][+${getDuration(begin)}] (doublechecked) duration=${((now-begin)/1000).toFixed(3)}`);
                    stats["completeResponseTime"] = getDuration(begin);
                    dbg(`[createRequestPromise->request->onEnd][${id}][${iteration}][+${getDuration(begin)}] begin=${begin}, now=${now}, completeResponseTime=${stats["completeResponseTime"]}`);
                    if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}: Response recieved in ${_YELLOW}${stats["completeResponseTime"]}ms${_RESET}`);
                    let parsedData = null;
                    try {
                        parsedData = JSON.parse(data);
                    } catch (e) {
                        parsedData = data;
                    }

                    if(responseHandler){
                        responseHandler({
                            url: finalURL,
                            user : id,
                            iteration,
                            stats : stats,
                            responseData : parsedData 
                        });
                    }
                    
                    if(harvestResponse) 
                        stats["responseData"] = parsedData;
                    
                    resolve(stats)
                });
            }).on("error", (err) => {
                logLargeJSONStream(`[createRequestPromise->request->onError][${id}][${iteration}][+${getDuration(begin)}] err`, err, dbg);
                if(stats["timeout"] == true)
                    if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}:${_RED} TIMEOUT!${_RESET}`);
                else
                    if (verbose) log(`    -> ${_CYAN}${id},it${iteration}${_RESET}:${_RED} ERROR [${err.code}]: ${err.message}${_RESET}`);
                stats["error"] = err.code;
                resolve(stats);

            });

            if(timeout){
                dbg(`[createRequestPromise][${id}][${iteration}][+${getDuration(begin)}] setTimout for +${getDuration(begin)+timeout}`);
                req.setTimeout(timeout, () => {
                    let now = getBegin();
                    dbg(`[createRequestPromise->request->TimeoutCallback][${id}][${iteration}][+${getDuration(begin)}] begin=${begin}, now=${now}, duration=${((now-begin)/1000).toFixed(3)} > timeout=${timeout}`);  
                    stats["timeout"] = true;
                    req.abort();
                });
            }
            if(requestBuilder && requestConfig.data)
                req.write(requestConfig.data)

            req.end();
        });
    }
    
    var requestPromiseParams = [];
    for (var i = 1; i <= concurrentUsers; i++) {

        var id = "user" + i;

        requestPromiseParams.push({
            "id": id,
            "url": url
        });
    }
    
    
    const requestPromises = requestPromiseParams.map(param => () => createRequestPromise(param["id"], param["url"]));
    
    function createRequestLotPromise(iteration, harvester) {
        return new Promise(function (resolve, reject) {
            if (verbose) log(` - ${iteration} started.`);
            initializedIterations++;
            promiseParallel(requestPromises)
                .then((results) => {
                    var requestLotResult = {
                        "id": iteration,
                        "result": computeLotStats(results)
                    };
                    harvester(requestLotResult);
                    resolve(requestLotResult);
                })
                .catch((err) => {
                    logLargeJSONStream(`[createRequestLotPromise->PromiseParallel->Catch] err`, err, dbg);
                    reject(err);
                });
        });
    }

    var initializedIterations = 0;

    var remainingIterations = iterations;
    
    var iterationResults = [];
    
    
    function requestLot(it, harvester) {
        createRequestLotPromise(it, harvester).catch((err) => {
            log(`  ITERATION ERROR --> ${_RED}${it}: ${err}${_RESET}`);
            remainingIterations--;
            log(`       Remaining Iterations: ${remainingIterations}`);
            if (iterationResults.length >= remainingIterations) {
                log(`\nResult:`);
                var results = {};              
                if(iterationResults.length > 0){
                    results = computeFullStats(iterationResults);
                    
                }else{
                    results.summary = {};
                    log("\nNo results to be shown.");
                }

                logLargeJSONStream('Summary', results.summary);
                results.logs = logs;

                if(resultsHandler)
                    resultsHandler(results);    

            }
        });
    }
    
    for (var i = 1; i <= iterations; i++) {
        dbg(`Iterations: ${i}, current(i): ${i}, delay=${delay}, delayTime(delay*(i-1))=${delay * (i - 1)}`);
        setTimeout(requestLot, (delay * (i - 1)), "iteration" + i, harvester);
    }
        
    function harvester(iterationResult) {
       
        iterationResults.push(iterationResult);
        var completedIterations = iterationResults.length;    
    
        log(`  -> ${_GREEN}${iterationResult.id}${_RESET} completed (${_GREEN}${completedIterations}/${remainingIterations}${_RESET} of ${_GREEN}${iterations}${_RESET})`);
    
        
        if (completedIterations >= remainingIterations) {
            log("\nResults:");
            const results = computeFullStats(iterationResults);
            logLargeJSONStream('Summary', results.summary);
            results.logs = logs;

            if(resultsHandler)
                resultsHandler(results); 
        }
    };

}

const fs = require('fs');
const JSONStream = require('JSONStream');

function logLargeJSONStream(label, obj, logger = console.log) {
  const stream = JSONStream.stringifyObject();
  stream.on('data', chunk => logger(`${label}:\n${chunk}`));
  stream.on('error', err => logger(`${label} [error]: ${err.message}`));
  
  Object.entries(obj).forEach(([key, val]) => stream.write([key, val]));
  stream.end();
}



module.exports = { run };