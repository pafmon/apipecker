#!/usr/bin/env node

const http = require('http');
const {
    promiseSerial,
    promiseParallel
} = require('./promiseUtils');
const {
    getBegin,
    getDuration
} = require('./timeUtils');
const {
    min,
    max,
    mean,
    std,
    round
} = require('./mathUtils');



if (process.argv.length <6) {
    console.log("Use apipecker <concurrentUsers> <iterations> <delay in ms> <url> [true|false]\nLast parameter enables the VERBOSE mode if true (default=false).");
    console.log("Example: apipecker 2 3 500 http://knapsack-api.herokuapp.com/api/v1/stress/10000/10 true");
    process.exit();
}




var concurrentUsers = process.argv[2] || 2;
var iterations = process.argv[3] || 3;
var delay = process.argv[4] || 500;
var url = process.argv[5] || 'http://knapsack-api.herokuapp.com/api/v1/stress/10000/10';
var verbose= process.argv[6] || false;

console.log("Stress configuration:");
console.log("  - Concurrent users: %d", concurrentUsers);
console.log("  - Iterations: %d", iterations);
console.log("  - Delay: %d", delay);
console.log("  - URL: <%s>", url);


process.stdout.write("Stressing");

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
            "completeResponseTime": 0.0
        };

        if (verbose) console.log("  - "+id+": Request to <%s>...", url);

        var begin = getBegin();

        http.get(url, (resp) => {

            let data = '';

            stats["initialResponseTime"] = getDuration(begin);


            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                stats["completeResponseTime"] = getDuration(begin);
                if (verbose) console.log("    -> "+id+": Response recieved in "+stats["completeResponseTime"]+"ms");
                resolve(stats)
            });

        }).on("error", (err) => {
            reject(id + ": " + err);
        });
    });
}

var requestPromiseParams = [];
for (var i = 1; i <= concurrentUsers; i++) {
    requestPromiseParams.push({
        "id": "user" + i,
        "url": url
    });
}


const requestPromises = requestPromiseParams.map(param => () => createRequestPromise(param["id"], param["url"]));

function createRequestLotPromise(iteration, harvester) {
    return new Promise(function (resolve, reject) {
        if (verbose) console.log(" - "+iteration+" started.");
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
        console.error("   --> "+it+": "+err);
        remainingIterations--;
        console.error("       Remaining Iterations:"+remainingIterations);
        if (iterationResults.length >= remainingIterations) {
            if(iterationResults.length > 0){
                console.log("\nResult:");
                console.log(JSON.stringify(computeFullStats(iterationResults).summary, null, 2));    
            }else{
                console.log("\nNo results to be shown.");
            }
        }
    });
}

for (var i = 1; i <= iterations; i++) {
    setTimeout(requestLot, (delay * (i - 1)), "iteration" + i, harvester);
}

process.stdout.write(":\n");

function harvester(iterationResult) {
   
    iterationResults.push(iterationResult);
    var completedIterations = iterationResults.length;    

    console.log("  -> %s completed (%d/%d of %d)", iterationResult.id,completedIterations,remainingIterations, iterations);

    
    if (completedIterations >= remainingIterations) {
        console.log("\nResult:");
        console.log(JSON.stringify(computeFullStats(iterationResults).summary, null, 2));
    }
};
