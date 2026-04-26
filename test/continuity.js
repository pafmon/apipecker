const { run } = require("../index.js");

const CONCURRENT_USERS = 3;
const MAX_ITERATIONS = 50; 
const DELAY = 50;
const min_iterations = 10;
const ITERATIONS_CUTOFF = 20;

const _RESET = '\x1b[0m';
const _CYAN = '\x1b[36m';
const _GREEN = '\x1b[32m';
const _RED = '\x1b[31m';



function myUrlBuilder(user, iteration) {
    const jitter = Math.floor(Math.random() * 15);
    return `http://localhost:3000/api/v1/stress/${100 + jitter}`;
}


n_iter = 0;
function myContinuityHandler(lotResult) {
    n_iter ++;


    if (n_iter < min_iterations) return true;

    console.log(`${_CYAN}[Continuity]${_RESET} Lote: ${lotResult.id} | Numero de iteración: ${n_iter} | Objetivo: ${ITERATIONS_CUTOFF}`);


    return !(n_iter == ITERATIONS_CUTOFF) ;
}

function myResultsHandler(results) {
    // console.log(`${_MAGENTA} Hey, I'm the resultsHandler, and I'm handling the results:\n ${JSON.stringify(results,null,2)}${_RESET}`);    
    


    console.log(`${_CYAN}\n---  SUMMARY ---${_RESET}`);
    console.log(`Executed lots: ${results.lotStats.length} / ${MAX_ITERATIONS}`);
    
    if (results.lotStats.length < MAX_ITERATIONS) {
        console.log(`${_GREEN}NUMBER OF ITERATIONS REACHED:${_RESET} should have stopped at ${ITERATIONS_CUTOFF} and stopped at ${results.lotStats.length}.`);
    } else {
        console.log(`${_RED}LIMIT REACHED:${_RESET} Iterations ran out and the script did not stop automatically.`);
    }
    process.exit(0);
}


run({
    concurrentUsers: CONCURRENT_USERS,
    iterations: MAX_ITERATIONS,
    delay: DELAY,
    verbose: true,
    consoleLogging: false,
    urlBuilder: myUrlBuilder,
    resultsHandler: myResultsHandler,
    continuityHandler: myContinuityHandler
});