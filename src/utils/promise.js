// Based on https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e


const promiseSerial = funcs =>
    funcs.reduce((promise, func) =>
        promise.then(result => func().then(Array.prototype.concat.bind(result))),
        Promise.resolve([]));

const promiseParallel = funcs =>
    Promise.all(funcs.map(func => func()));

module.exports = { promiseSerial,promiseParallel };

/*  USAGE EXAMPLE ******************************************************************************************************

function counter(id, speed, i) {
    if (!i) i = 0;
    return setInterval((id) => {
        console.log(id + ":" + (++i));
    }, speed, id);
}

function createPromise(id, speed, deadline) {
    return new Promise(function (resolve) {
        var counterObj = counter(id, speed);
        setTimeout(() => {
            clearTimeout(counterObj);
            resolve(id + " resolved");
        }, deadline);
    });
}

const promiseParams = [{
    id: "P1",
    speed: 100,
    deadline: 2000
}, {
    id: "P2",
    speed: 300,
    deadline: 4000
}];

const promises = promiseParams.map(param => () => createPromise(param["id"], param["speed"], param["deadline"]));


console.log("-----SERIAL-----");
promiseSerial(promises)
    .then((serialResult) => {
        console.log("serialResult:" + serialResult); 
        console.log("-----PARALLEL with joint resolution -----");
        promiseParallel(promises)
            .then((parallelResult) => {
                console.log("parallelResult:" + parallelResult);
                console.log("-----PARALLEL with isolated resolution-----");
                promises.forEach((p) => p().then(console.log.bind(console)));
            })
            .catch(console.error.bind(console));
        
    })
    .catch(console.error.bind(console));
**************************************************************************************************************************/