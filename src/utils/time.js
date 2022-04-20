
function getBegin() {
        var beginHR = process.hrtime()
        return beginHR[0] * 1000000 + beginHR[1] / 1000;
}

function getDuration(begin) {
    var finishHR = process.hrtime()
    var finish = finishHR[0] * 1000000 + finishHR[1] / 1000;
    var duration = (finish - begin) / 1000;
    return Math.round(duration * 1000) / 1000;
}

module.exports = { getBegin,getDuration };