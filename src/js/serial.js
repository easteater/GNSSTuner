const {SerialPort} = require('serialport')
const { promisify } = require('util');
const GnssParser = require('./js/GNSSParser');
const gnssParser = new GnssParser();
/*
V $GPTXT,01,01,01,ANTENNA OPEN*25
V $GNGGA,031017.000,3540.47383,N,11938.11823,E,1,23,0.6,26.6,M,3.5,M,,*47
V $GNGLL,3540.47383,N,11938.11823,E,031017.000,A,A*41
$GNGSA,A,3,03,10,12,25,26,28,29,31,32,194,199,,1.1,0.6,0.9,1*33
$GNGSA,A,3,06,08,09,13,14,16,24,25,26,33,39,42,1.1,0.6,0.9,4*35
$GPGSV,4,1,13,03,21,314,21,10,18,184,22,12,05,040,18,16,10,212,15,0*6A
$GPGSV,4,2,13,25,38,047,13,26,38,217,33,28,65,342,27,29,24,104,27,0*63
$GPGSV,4,3,13,31,51,295,26,32,67,113,20,194,65,117,24,195,,,08,0*56
$GPGSV,4,4,13,199,48,167,15,0*6E
$BDGSV,3,1,12,06,65,333,25,08,22,209,19,09,52,304,23,13,27,219,19,0*72
$BDGSV,3,2,12,14,66,195,26,16,65,337,27,24,75,355,21,25,36,253,29,0*75
$BDGSV,3,3,12,26,30,051,23,33,67,275,27,39,68,004,19,42,43,167,23,0*79
$GNRMC,031017.000,A,3540.47383,N,11938.11823,E,17.92,256.76,301223,,,A,V*30
$GNVTG,256.76,T,,M,17.92,N,33.18,K,A*27
$GNZDA,031017.000,30,12,2023,00,00*4F

 */

//




// let gnssParser = new GnssParser();
let portAreOpen = false;
let autoRetry = false;

let oldList  = {};
let lastOpenPort  = null;
let port = null;
const serialPortSelect = $('#serialPortSelect');
let dataBufferList = []
//serialPortSelect 最后选择的端口需要记录
serialPortSelect.on('change', function(e){
    lastOpenPort = $(this).val();
    log("lastOpenPort",lastOpenPort)
})

async function closeSerialConnection(throwErr = true) {
    try {
        const closePort = promisify(port.close).bind(port);
        await closePort();
        console.log('Serial port closed successfully.');
        portAreOpen = false;
        autoRetry = false; //手动关闭串口的不再重试
    } catch (error) {
        if (throwErr) {
            console.error('Error while closing serial port:', error);
        }
        portIsClosed()
    }
}

async function listSerialPorts() {
    await SerialPort.list().then((ports, err) => {
        if (err) {
            console.log("list serial port error:", err)
            log("list serial port error: no ports", err.message)

            return
        }
        // console.log('ports', ports);

        if (ports.length === 0) {
            log("list serial port error: no ports")
        }
        if (  oldList.length === ports.length) {
            return
        }
        log("new ports discovered")
        serialPortSelect.empty() // clear old options
        ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port.path;
            option.textContent =  port.path;
            if (lastOpenPort === port.path) {
                option.selected = true;
                if (!portAreOpen && autoRetry && document.getElementById("autoRetryCheckBox").checked) {
                    openSerialConnection();//意外断开,非主动断开,且允许自动重试时,自动打开串口
                }
            }
            serialPortSelect.append(option);

        });
        if (lastOpenPort=== null&& ports.length > 0){
            lastOpenPort = ports[0].path;
            log("lastOpenPort",lastOpenPort)
        }
        oldList = ports;
    })
}


let dataBuffer = ""
let lastCmdPart = ""
function serialPortDataOnRecv(data) {
    if (data === undefined || data === null) {
        data = "";
    }
    dataBuffer += data.toString();
    dataBuffer.split("\n").forEach(function (line) {
        if (line.startsWith("$")) {
            dataBufferList.push(line.trim());
        } else {
            lastCmdPart = line;
        }
    })

    dataBuffer = lastCmdPart;
    // console.log("dataBuffer", dataBuffer, "lastCmdPart",lastCmdPart, "dataBufferList",dataBufferList)
    appendMsgLog(data.toString())
}

async function openSerialConnection() {
    closeSerialConnection(false)
    const portName = lastOpenPort;
    if (!portName) {
        log("please select serial port")
        showToast("please select serial port")
        return;
    }
    let baudRate = parseInt($("#baudRateInput").val());
    let portObj = {path: portName, baudRate: baudRate, };
    log("open serial port :",portName, baudRate)
    console.log("open serial port :",portObj)
    port = new SerialPort(portObj);
    // 监听串口数据
    port.on('data', function (data) {
        serialPortDataOnRecv(data)
    });
    // 监听串口错误
    port.on('error', function (err) {
        console.log('Serial error:', err);
        showToast(err, 3000)
    });
    port.on('open', function (data) {
        console.log('已打开串口')
        portAreOpen = true;
        $("#openSerialConnectionBtn").text("关闭串口");
        $("#openSerialConnectionBtn").removeClass("btn-primary");
        $("#openSerialConnectionBtn").addClass("btn-danger");
        $("#openSerialConnectionBtn").attr("onclick", "closeSerialConnection()");
        $("#baudRateInput").attr("disabled", "disabled");
        $("#serialPortSelect").attr("disabled", "disabled");
        //按钮打开时,设置为true
        autoRetry  =true;
    });



    port.on('close', function () {
        console.log('串口已关闭')
        portIsClosed()
    });

    port.on('disconnect', function () {
        console.log('串口已 disconnect')
        portIsClosed()
    });


}
function parseAndSyncMsg(data) {
    gnssParser.parseNMea0180(data)
    ipcRenderer.send('gps.update', gnssParser.gnssRuntimeData);
    // console.log('gps.update', gnssParser.gnssRuntimeData);


}
function asyncCmdBuffer(){
    while (dataBufferList.length > 0) {
        parseAndSyncMsg(dataBufferList.shift());
    }
}
setInterval(() => {
    asyncCmdBuffer()
}, 100);





function portIsClosed() {
    portAreOpen = false;
    $("#openSerialConnectionBtn").text("打开串口");
    $("#openSerialConnectionBtn").addClass("btn-primary");
    $("#openSerialConnectionBtn").removeClass("btn-danger");
    $("#openSerialConnectionBtn").attr("onclick", "openSerialConnection()");
    $("#baudRateInput").attr("disabled", "");
    $("#serialPortSelect").attr("disabled", "");
}