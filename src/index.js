const http = require('http');
const https = require('https');

const urlParser = require('url');

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

var logs = [];
var consoleLogging = false;

function log(s){
    logs.push(s);
    if(consoleLogging)
        console.log(s);
};


function run(config){

    const concurrentUsers = config.concurrentUsers;
    const iterations = config.iterations;
    const delay = config.delay;
    var  url = config.url;
    const verbose = config.verbose;
    const method = config.method;
    consoleLogging = config.consoleLogging;

    const urlBuilder = config.urlBuilder;
    const requestBuilder = config.requestBuilder;
    const resultsHandler = config.resultsHandler;
     
    try{
        
        if(urlBuilder)
            url = urlBuilder("user1");  
    
        var protocol = urlParser.parse(url, true).protocol.slice(0,-1);

    }catch(err){
        throw new Error(`Invalid URL <${url}> : ${err}`);
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
    log(`  - Concurrent users: ${concurrentUsers}`);
    log(`  - Iterations: ${iterations}`);
    log(`  - Delay: ${delay}`);
    log(`  - URL: <${url}>`);
    log(`  - Log mode: ${(verbose)?"VERBOSE":"normal"}`);
    
    
    log("Starting execution...");
    
    function computeLotStats(stats) {
        return {
            "stats": stats,
            "summary": {
                "count": stats.length,
                "min": round(min(stats.map(n=>n.completeResponseTime)),3),
                "max": round(max(stats.map(n=>n.completeResponseTime)),3),
                "mean": round(mean(stats.map(n=>n.completeResponseTime)),3),
                "std": round(std(stats.map(n=>n.completeResponseTime)),3)
            }
        };
    }
    
    
    function computeFullStats(lotStats) {
    
        var responseTimes = [];
        
        lotStats.forEach(lotStat => {
            Array
            .prototype
            .push
            .apply(responseTimes
                    ,lotStat
                        .result
                        .stats.map(n=>n.completeResponseTime));
        });
    
        var fullStats = {
            "lotStats": lotStats,
            "summary": {
                "count": responseTimes.length,
                "min": round(min(responseTimes),3),
                "max": round(max(responseTimes),3),
                "mean": round(mean(responseTimes),3),
                "std": round(std(responseTimes),3)
            }
        };
        return fullStats;
    }
    
    
    function createRequestPromise(id, url) {
        return new Promise(function (resolve, reject) {
            var stats = {
                "id": id,
                "initialResponseTime": 0.0,
                "completeResponseTime": 0.0,
                "statusCode" : null
            };

            var options = {};

            options.method = method;
 
            var begin = getBegin();

            var requestConfig = {};

            if(requestBuilder){
                requestConfig = requestBuilder(id);    
                options = requestConfig.options;
                if (!options.method)
                    options.method = method;
            }

            if (!options.method)
                options.method = "GET";

            if (verbose) log(`  - ${id}: ${options.method} Request to <${url}>...`);

            const req = requester.request(url,options, (resp) => {
    
                if (verbose) log(`    -> ${id}: Status Code ${resp.statusCode}`);
                
                let data = '';
                stats["statusCode"] = resp.statusCode;
                stats["initialResponseTime"] = getDuration(begin);
    
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
    
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    stats["completeResponseTime"] = getDuration(begin);
                    if (verbose) log(`    -> ${id}: Response recieved in ${stats["completeResponseTime"]}ms`);
                    resolve(stats)
                });
    
            }).on("error", (err) => {
                reject(id + ": " + err);
            });

            if(requestBuilder && requestConfig.data)
                req.write(requestConfig.data)

            req.end();

        });
    }
    
    var requestPromiseParams = [];
    for (var i = 1; i <= concurrentUsers; i++) {
        var finalURL = url;
        var id = "user" + i;

        if(urlBuilder)
           finalURL = urlBuilder(id);   

        requestPromiseParams.push({
            "id": id,
            "url": finalURL
        });
    }
    
    
    const requestPromises = requestPromiseParams.map(param => () => createRequestPromise(param["id"], param["url"]));
    
    function createRequestLotPromise(iteration, harvester) {
        return new Promise(function (resolve, reject) {
            if (verbose) log(` - ${iteration} started.`);
            promiseParallel(requestPromises)
                .then((results) => {
                    var requestLotResult = {
                        "id": iteration,
                        "result": computeLotStats(results)
                    };
                    harvester(requestLotResult);
                    resolve(requestLotResult);
                })
                .catch(reject);
        });
    }
    
    var remainingIterations = iterations;
    
    var iterationResults = [];
    
    
    function requestLot(it, harvester) {
        createRequestLotPromise(it, harvester).catch((err) => {
            log(`  ITERATION ERROR --> ${it}: ${err}`);
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

                log(JSON.stringify(results.summary, null, 2));
                results.logs = logs;

                if(resultsHandler)
                    resultsHandler(results);    

            }
        });
    }
    
    for (var i = 1; i <= iterations; i++) {
        setTimeout(requestLot, (delay * (i - 1)), "iteration" + i, harvester);
    }
        
    function harvester(iterationResult) {
       
        iterationResults.push(iterationResult);
        var completedIterations = iterationResults.length;    
    
        log(`  -> ${iterationResult.id} completed (${completedIterations}/${remainingIterations} of ${iterations})`);
    
        
        if (completedIterations >= remainingIterations) {
            log("\nResults:");
            const results = computeFullStats(iterationResults);
            log(JSON.stringify(results.summary, null, 2));
            results.logs = logs;

            if(resultsHandler)
                resultsHandler(results); 
        }
    };

}

module.exports = { run };