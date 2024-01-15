// 定义 SatelliteInfo 结构体
const SatelliteInfo = {
    prn: '',
    elevation: 0,
    azimuth: 0,
    snr: 0,
    isValid: false,
};
// 定义 GGA 结构体
const GGA = {
    utcTime: '',
    latitude: '',
    latitudeDirection: '',
    longitude: '',
    longitudeDirection: '',
    gpsStatus: '',
    satelliteCount: '',
    hdop: '',
    altitude: '',
    geoidalSeparation: '',
    differentialTime: '',
    differentialStationID: '',
};
// 定义 RMC 结构体
const RMC = {
    utcTime: '',
    status: '',
    latitude: '',
    latitudeDirection: '',
    longitude: '',
    longitudeDirection: '',
    groundSpeed: '',
    groundHeading: '',
    utcDate: '',
    magneticVariation: '',
    magneticVariationDirection: '',
    modeIndicator: '',
};
// 定义 GSV 结构体
const GSV = {
    totalMessages: 0,
    messageNumber: 0,
    totalSatellites: 0,
    totalUsed: 0,
    satellites: {},
};
// 定义 GLL 结构体
const GLL = {
    latitude: '',
    latitudeDirection: '',
    longitude: '',
    longitudeDirection: '',
    utcTime: '',
    status: '',
    modeIndicator: '',
};
// 定义 GSA 结构体
const GSA = {
    mode2: '',
    mode1: '',
    satellitePRNs: [],
    pdop: '',
    hdop: '',
    vdop: '',
};

// 定义 GnssRuntimeData 结构体


class GNSSParser {
    supportedCmdList = ["RMC", "TXT", "GGA", "GLL", 'GSA', "GSV"]
    gnssRuntimeData = {
        gga: GGA,
        gllMap: {},
        gsaMap: {},
        gsv: GSV,
        rmc: {
            utcTime: '',
            status: '',
            latitude: '',
            latitudeDirection: '',
            longitude: '',
            longitudeDirection: '',
            groundSpeed: '',
            groundHeading: '',
            utcDate: '',
            magneticVariation: '',
            magneticVariationDirection: '',
            modeIndicator: '',
        },
    }
    lastCmd = "";

    test() {
        console.log("GNSSParser.test")
    }

    parseRMC(msg) {
        console.log("parseRMC", msg)
    }


    parseNMea0180(singleCmdTxt) {
        if (singleCmdTxt === null || singleCmdTxt=== undefined||singleCmdTxt === '' || singleCmdTxt.indexOf(",") === -1) {
            console.log("cmd is null ")
            return false;
        }
        // console.log("cmd is   ", singleCmdTxt)

        const orgCommand = singleCmdTxt.split(',')[0];
            if (orgCommand === '') {
            return false;
        }
        const   cmd = orgCommand.slice(-3);

        if (cmd.length !== 3 || !this.supportedCmdList.includes(cmd)) {
            // log('不支持该指令', singleCmdTxt);
            return;
        }
        const parseFunctions = {
            GGA: this.parseGGA.bind(this),
            GSV: this.parseGSV.bind(this),
            RMC: this.parseRMC.bind(this),
            GSA: this.parseGSA.bind(this),
            GLL: this.parseGLL.bind(this),
            TXT: this.parseTXT.bind(this),
        };
        const parseFunction = parseFunctions[cmd];
        if (parseFunction) {
            // console.log('支持指令', cmd )
            parseFunction.call(this, singleCmdTxt);
            this.lastCmd  = cmd;

        } else {
            // console.log(cmd, "解析器,目前不存在, 具体为:", singleCmdTxt);
        }
    }

    parseTXT(cmdTxt) {
        const fields = cmdTxt.split(',');
        if (fields.length < 3 ) {
            log("Invalid command", cmdTxt)
            return;
        }
        this.gnssRuntimeData.txt = fields[4];
        return true;
    }
    parseGGA(cmdTxt) {
        const gga = this.gnssRuntimeData.gga;
        const fields = cmdTxt.split(',');
        if (fields.length >= 14  ) {
            gga.utcTime = fields[1];
            gga.latitude = fields[2];
            gga.latitudeDirection = fields[3];
            gga.longitude = fields[4];
            gga.longitudeDirection = fields[5];
            gga.gpsStatus = fields[6];
            gga.satelliteCount = fields[7];
            gga.hdop = fields[8];
            gga.altitude = fields[9];
            gga.geoidalSeparation = fields[10];
            gga.differentialTime = fields[11];
            gga.differentialStationID = fields[12];
        }
        this.gnssRuntimeData.gga = gga;
        // console.log("gga 解析完毕:", this.gnssRuntimeData.gga );
        return true;
    }

    parseGLL(message) {
        const fields = message.split(",");

        if (fields.length < 7) {
            console.log("Invalid GLL sentence");
            return false;
        }

        const gll = GLL;//this.createAndInitialize(GLL);
        gll.latitude = fields[1];
        gll.latitudeDirection = fields[2];
        gll.longitude = fields[3];
        gll.longitudeDirection = fields[4];
        gll.utcTime = fields[5];
        gll.status = fields[6];
        gll.modeIndicator = fields[7];

        this.gnssRuntimeData.gllMap[fields[0]] = gll;
        // console.log("gll 解析完毕:", this.gnssRuntimeData.gllMap);
        return true;
    }

    parseGSV(gsvData) {
        const gsv = this.gnssRuntimeData.gsv;
        const fields = gsvData.split(',');
        const fieldCount = fields.length;

        if (fieldCount < 4) return false;

        if (this.lastCmd !== 'GSV') {
            gsv.totalUsed = 0;
            gsv.satellites = [];
            gsv.totalSatellites = 0;

        }
        gsv.totalMessages = parseInt(fields[1]);
        gsv.messageNumber = parseInt(fields[2]);

        if (gsv.messageNumber === gsv.totalMessages) {
            gsv.totalSatellites += parseInt(fields[3]);
        }

        const satelliteCount = (fieldCount - 4) / 4;

        for (let i = 0; i < satelliteCount; ++i) {
            const index = i * 4 + 4;
            const satellite = {
                prn: fields[index],
                elevation: parseInt(fields[index + 1]),
                azimuth: parseInt(fields[index + 2]),
                snr: parseInt(fields[index + 3]),
                isValid: false,
            };
            if (fields[index] !== "" && fields[index + 1] !== "" && fields[index + 2] !== "") {
                gsv.totalUsed++;
                satellite.isValid = true;
                // console.log("可视:", fields[index], ":", fields[index + 1], ":", fields[index + 2]);
            } else {
                // console.log("不可视:", fields[index], ":", fields[index + 1], ":", fields[index + 2]);
            }

            if (satellite.prn === "") {
                satellite.prn = "-" + Math.floor(Math.random() * 1000).toString();
            }

            gsv.satellites[satellite.prn] = satellite;
        }

        this.gnssRuntimeData.gsv = gsv;
        return gsv.messageNumber === gsv.totalMessages;
    }

    parseRMC(message) {
        const fields = message.split(",");
        const rmc = this.gnssRuntimeData.rmc;

        if (fields.length >= 13) {
            rmc.utcTime = fields[1].substring(0, 2) + ":" + fields[1].substring(2, 4) + ":" + fields[1].substring(4, 6)
            rmc.status = fields[2];
            this.ready = rmc.status === "A";
            rmc.latitude = this.convertDMMtoDD(fields[3]);
            rmc.latitudeDirection = fields[4];
            rmc.longitude = this.convertDMMtoDD(fields[5]);
            rmc.longitudeDirection = fields[6];
            rmc.groundSpeed = fields[7];
            rmc.groundHeading = fields[8];
            rmc.utcDate = "20" + fields[9].substring(4, 6) + "-" + fields[9].substring(2, 4) + "-" + fields[9].substring(0, 2);//rmcDate.toString("yyyy-MM-dd");
            rmc.magneticVariation = fields[10];
            rmc.magneticVariationDirection = fields[11];
            rmc.modeIndicator = fields[12];
        }
        this.gnssRuntimeData.rmc = rmc;
        // console.log("rmc 解析完毕:",this.gnssRuntimeData.rmc);
        return true;
    }

    getSatelliteType(prn) {
        const prnValue = parseInt(prn);

        if (isNaN(prnValue)) {
            return "Invalid PRN";
        }

        if (prnValue >= 1 && prnValue <= 32) {
            return "GPS[" + prn + "]";
        } else if (prnValue >= 33 && prnValue <= 64) {
            return "SBAS[" + prn + "]";
        } else if (prnValue >= 65 && prnValue <= 96) {
            return "GLONASS[" + prn + "]";
        } else if (prnValue >= 193 && prnValue <= 199) {
            return "QZSS[" + prn + "]";
        } else if (prnValue >= 201 && prnValue <= 261) {
            return "BD[" + prn + "]";
        } else if (prnValue >= 301 && prnValue <= 336) {
            return "GALILEO[" + prn + "]";
        } else if (prnValue >= 901 && prnValue <= 918) {
            return "IRNSS[" + prn + "]";
        }

        return "UNKNOW[" + prn + "]";
    }

    parseGSA(message) {
        const fields = message.split(",");

        if (fields.length < 18) {
            console.log("Invalid GPGSA sentence");
            return false;
        }

        const gsa = GSA;
        gsa.mode2 = fields[1];
        gsa.mode1 = fields[2];
        gsa.satellitePRNs = fields.slice(3, 15);
        gsa.pdop = fields[15];
        gsa.hdop = fields[16];
        gsa.vdop = fields[17];

        this.gnssRuntimeData.gsaMap[fields[0]] = gsa;
        // console.log("gsa 解析完毕:", this.gnssRuntimeData);
        return true;
    }

    isReady() {
        return this.ready;
    }


    getGNSSRuntimeData() {
        return this.gnssRuntimeData;
    }

    clearBuffer() {
        this.gnssRuntimeData.gsv.totalUsed = 0;
        this.gnssRuntimeData.gsv.satellites = {};
        this.gnssRuntimeData.gsv.totalSatellites = 0;
    }

    convertDMMtoDD(dmmString) {
        // Extract the degree part, extract the minute part, and convert the degree-minute format to decimal degrees.
        let dmm = parseFloat(dmmString);
        // 提取度数部分
        let degrees =  Math.floor(dmm / 100);
        // 提取分数部分
        let minutes = dmm - degrees * 100;
        // 将度分格式转换为度数格式
        let dd = degrees + minutes / 60;
        return dd  + "";
    }

}

module.exports = GNSSParser;
