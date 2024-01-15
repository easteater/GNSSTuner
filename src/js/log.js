let logArea = $("#logTextarea")
const logTextarea = $('#messageTextarea');

function log(...logTxt) {
    let now = new Date().toLocaleString();
    logArea.val("[" + now + "] " + logTxt.join(' ') + "\n" + logArea.val());
}
// 清除日志功能
function clearMsgLog() {
    logTextarea.val('') ;
}  // 清除日志功能
function clearLog() {
    logArea.val('') ;
}


function saveMsgLog() {
    const fs = require('fs');
    const path = require('path');
    const currentDate = new Date();
    const fileName = `log-${currentDate.getFullYear()}-${padNumber(currentDate.getMonth() + 1)}-${padNumber(currentDate.getDate())}-${padNumber(currentDate.getHours())}-${padNumber(currentDate.getMinutes())}-${padNumber(currentDate.getSeconds())}-${currentDate.getMilliseconds()}.txt`;

    const filePath = path.join(__dirname, fileName);

    fs.writeFileSync(filePath, logTextarea.text(), 'utf-8');
    if (document.getElementById("clearOnSaved").checked ) {
        clearMsgLog();
    }

    showToast("保存成功!" + filePath)
}




function padNumber(number) {
    return number.toString().padStart(2, '0');
}

//日志自动滚动相关功能
let msgAutoScroll = true;
function setMsgAutoScroll(){
    msgAutoScroll = document.getElementById("msgAutoScrollBox").checked;
}
logTextarea.on('wheel', () => {
    // 标记用户滚动
    msgAutoScroll = false;
    document.getElementById("msgAutoScrollBox").checked = false;
});


// 追加日志到文本框

function appendMsgLog(message) {
    logTextarea.append(message  );
    if (msgAutoScroll) {
        logTextarea.scrollTop(logTextarea[0].scrollHeight);
    }
}