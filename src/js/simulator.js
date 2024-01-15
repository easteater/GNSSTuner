// const GnssParser = require('./js/GNSSParser');
// const gnssParser = new GnssParser();
function startGpsServer() {
    const fs = require('fs');
    let gnssCmdLog = "";
    fs.readFile(__dirname + '/../static_file/other/gnss.txt', 'utf8', (err, data) => {
        if (err) throw err;
        gnssCmdLog = data;
    });
    let gnssCmdList = [];
    // 模拟gps服务器的运行
    setInterval(()=>{
        serialPortDataOnRecv(gnssCmdList.shift() + "\n")
        if (gnssCmdList.length <= 0) {
            gnssCmdList =gnssCmdLog.split("\n");
        }
    }, 100)
}