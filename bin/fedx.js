#!/usr/bin/env node

var program = require('commander'),
    Promise = require("bluebird"),
    path = require("path"),
    color = require('bash-color'),
    fs = require('fs'),
    lineReader = require('line-reader'),
    postcss = require('postcss'), //postcss相关
    autoprefixer = require('autoprefixer'),
    cssnano = require('cssnano'),
    precss = require('precss'),
    postcssSorting = require('postcss-sorting'),
    cssMqpacker = require('css-mqpacker'),
    spritesmith = require('spritesmith'), //雪碧图
    sprites = require('postcss-sprites').default,
    updateRule = require('postcss-sprites').updateRule,

    browserSync = require('browser-sync'),

    http = require('http'),
    readdirp = require('readdirp'),
    json = require('JSONStream'),
    util = require('util'),
    rd = require('rd'),
    readLine = require('lei-stream').readLine,
    writeLineStream = require('lei-stream').writeLine,
    request = require('request'),
    ip = require('ip'), // 获取局域网ip地址方便测试
    ipn = ip.address(),
    Q = require('q'),
    Qd = Q.defer(),
    flowCur = false;


var chokidar = require('chokidar');

// promise代理函数
// 读文件
var fsReadFile = (file) => {
    var s = readLine(fs.createReadStream(file), {
        newline: '\n',
        autoNext: true,
        encoding: function(data) {
            return JSON.parse(data);
        }
    });
    s.on('data', function(data) {
        Qd.resolve(data);
        s.next();
    });
    return Qd.promise;
}

// fsReadFile('./fedxConfig.json').then((value) => {
//     console.log(value)
//     return value
// }).then((value) =>{
//     console.log(value)
// })


// 1查找文件 => 返回路径及其，查找结果
// 2读取文件 => 判断结果，读取文件 => 返回配置信息
// 3匹配路径 => 返回带绝对路径配置
// 4处理文件 => 处理css => 返回配置信息
// 5.


// 写文件
var fsWritFile = (file, data) => {
        var s = writeLineStream(fs.createWriteStream(file), {
            newline: '\n',
            encoding: function(data) {
                return JSON.stringify(data);
            },
            cacheLines: 0
        });
        s.write(data, function() {
            Qd.resolve(data);
        });
        s.end();
        return Qd.promise;
    }
    // 查找文件
var listFile = (paths, type) => {
    var fileArr = [];
    if (type === undefined) type = ['']
    rd.eachSync(paths, function(f, s) {
        var filename = path.basename(f);
        for (var m in type) {
            if (m == '') type[m] = '';
            if ((filename.indexOf(type[m]) != -1) && (filename != '')) {
                var fileStat = {
                    fileType: (function(f) {
                        if (path.extname(f).slice(1, path.extname(f).length).toUpperCase() == '') {
                            const Reg = new RegExp(/(^\.)|(~$)/)
                            if (Reg.test(path.basename(f)))
                                return '临时文件';
                            else return '文件夹';
                        } else {
                            return path.extname(f).slice(1, path.extname(f).length).toUpperCase();
                        }
                    }(f)),
                    fileName: path.basename(f),
                    fileSize: s.size,
                    fileIno: s.ino,
                    fileAtime: s.atime.toLocaleString(),
                    fileMtime: s.mtime.toLocaleString(),
                    fileCtime: s.ctime.toLocaleString(),
                    filePath: f
                }
                console.log(s)
                fileArr.push(fileStat);
                Qd.resolve(fileArr);
            }
        }
    });
    return Qd.promise;
}

// 流控制
var flow = (str) => {
        if (flowCur == true)
            console.log(color.purple('[FLOW] >>> ' + str));
    }
    // 查找绝对路径
var getAbsolutePath = (root, fileName) => {
    rd.each(root, function(f, s, next) {
        if (path.basename(f) == fileName)
            return f;
        next();
    }, function(err) {
        if (err) throw err;
        console.log(f)
    });
}


var flg = true;
var md = {};
var getconfig = (confFile) => {
        flow('开始读取配置信息')
        fs.readFile(confFile, function(err, data) {
            if (err) throw err;
            var datajson = JSON.parse(data),
                r,
                xx = process.cwd().split(path.sep);
            xx = xx.slice(xx.length - 1, xx.length).join('');
            if (datajson.mode == true) {
                r = process.cwd();
                datajson.rootPath = xx;
            } else {
                var cc = process.cwd().split(path.sep);
                r = cc.slice(0, cc.indexOf(datajson.rootPath) + 1).join(path.sep);
            }
            var kk = ['root', 'html', 'postcss', 'images', 'css'];
            flow('检测目录结构是否与配置一致')
            rd.each(r, function(f, s, next) {
                switch (path.basename(f)) {
                    case datajson.rootPath:
                        if (datajson.mode == true) {
                            md.rootAbsolute = process.cwd();
                            datajson.rootAbsolute = process.cwd();
                            kk[0] = 'null'
                        }
                        break;
                    case datajson.htmlPath:
                        md.htmlAbsolute = f;
                        datajson.htmlAbsolute = f;
                        kk[1] = 'null'
                        break;
                    case datajson.postcssPath:
                        md.postcssAbsolute = f;
                        datajson.postcssAbsolute = f;
                        kk[2] = 'null'
                        break;
                    case datajson.imagesPath:
                        md.imgAbsolute = f;
                        datajson.imgAbsolute = f;
                        kk[3] = 'null'
                        break;
                    case datajson.cssPath:
                        md.cssAbsolute = f;
                        datajson.cssAbsolute = f;
                        kk[4] = 'null'
                        break;
                }
                next();
            }, function(err) {
                flow('目录结构于配置一致')
                if (err) throw err;
                var ccc = kk.every(function(item, index, array) {
                    return item == 'null';
                });
                flow('正在计算所需目录绝对路径');
                if (ccc) {
                    flow('已计算出所需目录所有绝对路径');
                    writeFile(path.join(process.cwd(), 'fedxConfig.json'), datajson);
                    flow('已将所有所需绝对路径写入本地配置文件中');
                    (function() {
                        if (flg) {
                            handlePostcss({
                                postcss: datajson.postcssAbsolute,
                                css: datajson.cssAbsolute,
                                img: datajson.imgAbsolute,
                                imgMin: datajson.imgMinQuality,
                                html: datajson.htmlAbsolute,
                                root: datajson.rootAbsolute
                            })
                            flg = false;
                        }
                        rd.each(datajson.postcssAbsolute, function(f, s, next) {
                            fs.watch(datajson.postcssAbsolute, function(event, filename) {
                                if (filename) {
                                    handlePostcss({
                                        postcss: datajson.postcssAbsolute,
                                        css: datajson.cssAbsolute,
                                        img: datajson.imgAbsolute,
                                        imgMin: datajson.imgMinQuality,
                                        html: datajson.htmlAbsolute,
                                        root: datajson.rootAbsolute
                                    })
                                }

                            });
                        })
                    })()
                } else {
                    flow('目录结构于配置一致')
                    flow('存在不匹配目录！')
                    var str = '';
                    for (var n = 0; n < kk.length; n++) {
                        if (kk[n] != 'null')
                            str += '【 ' + kk[n] + ' 】';
                    }
                    console.log(color.red('[ERROR] ') + '没有找到' + color.red(str) + '目录。')
                    console.log(color.cyan('[TIPS] ') + '请重新设置目录使用' + color.red('【 fedx - c 】') + '完成设置！')
                }
            });
        });
    }
    // // postcss处理
    //

// 自定义postcss函数函数函数函数
function mobilepx2(css) {
    flow('已开启移动端px单位除2功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/(\d*\.?\d+)px/ig, function(str) {
                return (parseFloat(str) / 2) + 'px';
            })

        })
    });
}

// 自定义postcss插件rem
function pxtorem(css) {
    flow('已开启pm转换rem')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/(\d*\.?\d+)pm/ig, function(str) {
                return (parseFloat(str) / 100) + 'rem';
            })
        })
    });
}


// 自定义postcss插件替换路径
function replaceImgPath(css) {
    flow('已开启postcss图片相对路径处理')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/url\(.*\)/, function(str) {
                str = 'url(' + abimg + '/' + str.slice(4, str.length - 1) + ')';
                return str;
            })
        })
    });
}

function postcssMedia(css) {
    flow('已开启媒体查询识别功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            if (rule.type === "atrule" || (rule.parent && rule.parent.type === "atrule")) {
                var mv = rule.parent.params;
                var mtv = {
                    'iphone4': 'screen and (device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)',
                    'iphone5': 'screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
                    'iphone6': 'only screen and (min-device-width: 375px) and (max-device-width: 667px) and (orientation: portrait)',
                    'iphone6p': 'only screen and (min-device-width: 414px) and (max-device-width: 736px) and (orientation: portrait)',
                    'landscape': 'screen and (orientation: landscape)'
                }
                switch (mv) {
                    case '(iphone4)':
                        return rule.parent.params = mtv.iphone4;
                        break;
                    case '(iphone5)':
                        return rule.parent.params = mtv.iphone5;
                        break;
                    case '(iphone6)':
                        return rule.parent.params = mtv.iphone6;
                        break;
                    case '(iphone6p)':
                        return rule.parent.params = mtv.iphone6p;
                        break;
                    case '(landscape)':
                        return rule.parent.params = mtv.iphone4;
                        break;
                }
            }
        });
    });
}


var cl = () => {
        console.log(color.black('this text is black'))
        console.log(color.red('this text is high-intensity red', true))
        console.log(color.green('this text is green'))
        console.log(color.yellow('this text is high-intensity yellow', true))
        console.log(color.blue('this text is blue'))
        console.log(color.purple('this text is purple'))
        console.log(color.cyan('this text is cyan'))
        console.log(color.white('this text is white'))
    }
    // cl()
    //获取绝对路径
var getabspath = () => {
    var listValue = ['rootPath', 'htmlPath', 'postcssPath', 'imagesPath', 'cssPath'];
    flow('查找配置文件')
    fs.exists(path.join(process.cwd(), 'fedxConfig.json'), function(exists) {
        if (exists) {
            flow('找到本地配置文件')
            getconfig(path.join(process.cwd(), 'fedxConfig.json'))
        } else {
            console.log(color.cyan('[TIPS]') + '你本地没有配置文件，将采用' + color.red('全局配置') + '！')
            flow('读取全局配置')
            getconfig(path.join(__dirname, '../template/config/fedxConfig.json'))
        }
    })
}

// 首次运行检测配置文件
var checkConfig = () => {
        var arr = rd.readSync(process.cwd(), function(err, files) {
            if (err) throw err;
            return files;
        });

        var t = 0;
        for (var i = 0; i <= arr.length; i++) {
            if (path.basename(arr[i]) != 'fedxConfig.json') {
                if (t == arr.length) {
                    console.log('当前项目没有找到配置文件，将读取原始配置文件')
                }
                t++;
            } else {
                console.log(color.cyan('[TIPS] ') + '在当前项目下找到配置文件，将读取配置信息')
                var dir = path.join(path.dirname(arr[i]), 'list.rd')
                console.log(redFileOne('./fedxConfig.json'))
                    // writeFile(dir, redFile(arr[i]))
                console.log(color.red(arr[i]))
            }
        }
    }
    // 打开浏览器，并且监听文件修改刷新浏览器
var browserFn = (options) => {
        var s = path.join(process.cwd());
        var bs = require("browser-sync").create();
        // var aa = fsReadFile('./fedxConfig.json');


        // bs.watch(options.html + path.sep + '*.html').on("change", bs.reload);
        // bs.watch('html/*.html').on("change", bs.reload);

        // bs.watch('**/*.css', function (event, file) {
        //     if (event === "change"){
        //         bs.reload('**/*.css');
        //     }
        // });
        // bs.init({
        //     server: {
        //         baseDir: './html',
        //         directory: true
        //     }
        // })
        // bs.watch(options.root + path.sep + '**/*.*', function (event, file) {
        //     if (event === "change"){
        //         bs.reload(options.root + path.sep + '**/*.*');
        //     }
        // });
        // bs.init({
        //     server: {
        //         baseDir: options.html,
        //         directory: true
        //     }
        // })
    }
    // browserFn();
    // console.log(md)
    // checkConfig()
    // 检查网络是否连接
var isNetWrok = () => {
        if (http.STATUS_CODES[404] === 'Not Found') {
            console.log(color.cyan('[TIPS] ') + '当前网络畅通，正在下载远程配置文件')
                // getOrigin();
        } else {
            console.log(color.cyan('[TIPS] ') + '您的网络不畅通，将采用备份方式处理!')
        }
    }
    // isNetWrok();

// 写入远程配置
var writeFile = (paths, datajson) => {
    var s = writeLineStream(fs.createWriteStream(paths), {
        newline: '\n',
        encoding: function(data) {
            return JSON.stringify(data);
        },
        cachelines: 0
    });
    s.write(datajson, function() {});
    s.end(function() {});
}


// 检测配置文件是否存在
var hasFile = (path, fileName, datajson) => {
    var filePath = path.join(path, fileName);
    var wp = path.join(__dirname, '../template/config/origin.json');
    var wp2 = path.join(__dirname, '../template/config/origin_bak.json');
    var arr = [];

    fs.exists(filePath, function(exists) {
        if (exists) {
            prompt(color.cyan('你本地已经存在配置文件(C覆盖) || (B备份)：'), function(c) {
                (function() {
                    var fug = (c) => {
                        if (c == 'C' || c == 'c' || c == '\n') {
                            writeFile(wp, datajson)
                            console.log(color.cyan('[TIPS] ') + '已覆盖配置文件！')
                        } else {
                            console.log(color.cyan('[TIPS] ') + '正在备份配置文件！')
                            rd.each(path.join(__dirname, '../template/config/'), function(f, s, next) {
                                var cc = path.basename(f, '.json');
                                if (cc.indexOf('_bak_') != -1) {
                                    var splitstr = cc.split('origin_bak_').join('');
                                    arr.push(Number(splitstr))
                                } else {
                                    arr.push(Number(0))
                                }
                                next()
                            }, function(err) {
                                if (err) throw err;
                                var maxBakfile = Math.max.apply(Math, arr),
                                    returnFileName = 'origin_bak_' + (maxBakfile + 1) + '.json';
                                fs.rename(wp, path.join(__dirname, '../template/config/' + returnFileName), function() {
                                    console.log(color.cyan('[TIPS] ') + '文件已经备份：' + path.join(__dirname, '../template/config/' + returnFileName))
                                    writeFile(wp, datajson)
                                })
                            });
                        }
                    }
                })()
            })
        } else {
            console.log(color.cyan('[TIPS] ') + '你本地没有配置文件正在写入！')
            writeFile(wp, datajson)
        }
    });
}



// 读取远程配置
var getOrigin = () => {
    request('http://raw.githubusercontent.com/iuunhao/fedx/master/config.json', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var datajson = JSON.parse(body);
            hasFile(__dirname, '../template/config/origin.json', datajson)
            console.log(color.cyan('[TIPS] ') + '读取完成!')
        }
    })
}




// 检测配置文件是否存在
var hasFileTips = (paths, fileName, datajson) => {
    var filePath = path.join(paths, fileName);
    writeFile(filePath, datajson)
    console.log(color.cyan('[TIPS] ') + '写入完成！')
}

// // 界面交互
var prompt = (prompt, callback) => {
    process.stdout.write(prompt);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', function(chunk) {
        process.stdin.pause();
        callback(chunk.trim());
    });
}


// 创建目录
var mkdirFn = () => {
    prompt(color.cyan('[INP]：') + '你是否要创建目录(y/n)：', (c) => {
        if (c == 'y' || c == 'Y' || c == '') {
            flow('选择创建目录')
            flow('开始读取目录配置信息')
            var cdir = [];
            var cdirarr = ['imagesPath', 'postcssPath', 'cssPath', 'htmlPath'];
            fsReadFile(path.join(process.cwd(), 'fedxConfig.json'))
                .then((value) => {
                    flow('成功读取目录配置信息')
                    for (var i in value) {
                        for (var j in cdirarr) {
                            if (i == cdirarr[j])
                                cdir[j] = value[i];
                        }
                    }
                    Qd.resolve(value);
                    return Qd.promise;
                })
                .then((value) => {
                    if (value.mode) {
                        for (var l in cdir) {
                            ((l) => {
                                fs.exists(cdir[l], (exists) => {
                                    if (!exists) {
                                        fs.mkdir(cdir[l], () => {
                                            console.log(color.green('[SUCCEED]') + '成功创建' + color.green(cdir[l]) + '目录')
                                        })
                                    } else {
                                        console.log(color.red('[ERROR]') + color.yellow('［' + cdir[l] + '］') + '目录已经存在!')
                                    }
                                })
                            })(l)
                        }
                    }
                })
        }
    })
}


var oneSet = (str, key, file) => {
    var dataJSON = {};
    if (file == 'global') {
        file = path.join(__dirname, '../template/config/fedxConfig.json')
    } else {
        file = path.join(process.cwd(), 'fedxConfig.json')
    }
    fs.exists(path.join(process.cwd(), 'fedxConfig.json'), function(exists) {
        if (exists) {
            flow('本地存在配置，只会替换修改项参数')
            fs.readFile(file, function(err, data) {
                dataJSON = JSON.parse(data);
                prompt(color.cyan(str + '：'), function(c) {
                    if (c == 'Y' || c == 'y') {
                        c = true;
                    } else if (c == 'N' || c == 'n') {
                        c = false;
                    } else if (typeof c == 'number') {
                        c = c + 0;
                    }
                    dataJSON[key] = c;
                    fs.writeFile('fedxConfig.json', JSON.stringify(dataJSON), function(err) {
                        if (err) throw err;
                        console.log(color.cyan('[TIPS]：写入完成'));
                    });
                })
            })
        } else {
            flow('本地不存在配置，其它选项将读取全局配置信息')
            fs.readFile(path.join(__dirname, '../template/config/fedxConfig.json'), function(err, data) {
                dataJSON = JSON.parse(data);
                prompt(color.cyan(str + '：'), function(c) {
                    if (c == 'Y' || c == 'y') {
                        c = true;
                    } else if (c == 'N' || c == 'n') {
                        c = false;
                    } else if (typeof c == 'number') {
                        c = c + 0;
                    }
                    dataJSON[key] = c;
                    fs.writeFile('fedxConfig.json', JSON.stringify(dataJSON), function(err) {
                        if (err) throw err;
                        console.log(color.cyan('[TIPS]：写入完成'));
                    });
                })
            })
        }
    })

}

// 配置默认设置;
var configVal = {};

var configSet = (key, value, file) => {
    var dataJSON = {};
    // if (file == 'global') {
    //     file = path.join(__dirname, '../template/config/fedxConfig.json')
    // } else {
    //     file = path.join(process.cwd(), 'fedxConfig.json')
    // }
    file = path.join(__dirname, '../template/config/fedxConfig.json')
    fs.readFile(file, function(err, data) {
        dataJSON = JSON.parse(data);
        if (value == '' || value == '\\n') {
            configVal[key] = dataJSON[key];
        } else {
            switch (key) {
                case 'debug':
                case 'mode':
                    if (value == 'y' || 'Y') {
                        configVal[key] = true;
                    } else {
                        configVal[key] = false;
                    }
                    break;
                case 'gitignore':
                    if (value == '' || value == '\\n') {
                        configVal[key] = [
                            "node_modules",
                            ".DS_Store",
                            "npm-debug.log"
                        ]
                    } else {
                        configVal[key] = value.split(',')
                    }
                default:
                    configVal[key] = value;
                    break;
            }
        }
    });
}

var confAll = (file) => {
    var fc;
    if (file == 'global') {
        flow('开始配置全局配置文件');
        fc = path.join(__dirname, '../template/config/fedxConfig.json')
    } else {
        flow('开始配置本地配置文件');
        fc = path.join(process.cwd(), 'fedxConfig.json')
    }
    prompt(color.purple('[INP]') + color.cyan('您的项目名称(FEDX)：'), function(c) {
        configSet('name', c, file)
        prompt(color.purple('[INP]') + color.cyan('是否为独立模式(y/n)：'), function(c) {
            configSet('mode', c, file)
            prompt(color.purple('[INP]') + color.cyan('你的项目根目录(.)：'), function(c) {
                configSet('rootPath', c, file)
                prompt(color.purple('[INP]') + color.cyan('图片目录(images)：'), function(c) {
                    configSet('imagesPath', c, file)
                    prompt(color.purple('[INP]') + color.cyan('postcss目录(postcss)：'), function(c) {
                        configSet('postcssPath', c, file)
                        prompt(color.purple('[INP]') + color.cyan('Jade模版目录(jade)：'), function(c) {
                            configSet('jadePath', c, file)
                            prompt(color.purple('[INP]') + color.cyan('Sprites前缀名称(icon)：'), function(c) {
                                configSet('spriteMark', c, file)
                                prompt(color.purple('[INP]') + color.cyan('css输出目录(css)：'), function(c) {
                                    configSet('cssPath', c, file)
                                    prompt(color.purple('[INP]') + color.cyan('html目录(html)：'), function(c) {
                                        configSet('htmlPath', c, file)
                                        prompt(color.purple('[INP]') + color.cyan('图片压缩质量(0-100)：'), function(c) {
                                            configSet('imgmin', c, file)
                                            prompt(color.purple('[INP]') + color.cyan('git过滤文件：'), function(c) {
                                                configSet('gitignore', c, file)
                                                console.log(configVal)
                                                var s = writeLineStream(fs.createWriteStream(fc), {
                                                    newline: '\n',
                                                    encoding: function(data) {
                                                        return JSON.stringify(data);
                                                    },
                                                    cachelines: 0
                                                });
                                                s.write(configVal, function() {});
                                                s.end(function() {});
                                                hasFileTips('.', 'fedxConfig.json', configVal)
                                                mkdirFn();
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}

var selProject = (c) => {
    var p = ['mobile', 'desktop'];
    if (!c || isNaN(c)) {
        prompt('项目类型(根目录) 1: mobile, 2: desktop : ', selProject);
        return false;
    }
}



program
    .version(require('../package.json').version)
    .option('-c, --config', '设置本地配置文件')
    .option('-C, --CONFIG', '设置全局配置文件')
    .option('-a, --name', '设置本地项目名称')
    .option('-A, --NAME', '设置全局项目名称')
    .option('-r, --root', '配置本地项目根目录')
    .option('-R, --ROOT', '配置全局项目根目录')
    .option('-t, --html', '设置本地html目录')
    .option('-T, --HTML', '设置全局html目录')
    .option('-i, --images', '设置本地images目录')
    .option('-I, --IMAGES', '设置全局images目录')
    .option('-j, --jade', '设置本地jade目录')
    .option('-J, --JADE', '设置全局jade目录')
    .option('-s, --css', '设置本地css输出目录')
    .option('-S, --CSS', '设置全局css输出目录')
    .option('-p, --postcss', '设置本地postcss目录')
    .option('-P, --POSTCSS', '设置全局postcss目录')
    .option('-d, --debug', '设置本地debug模式')
    .option('-D, --DEBUG', '设置全局debug模式')
    .option('-e, --sprite', '设置本地sprite前缀')
    .option('-E, --SPRITE', '设置全局sprite前缀')
    .option('-n, --imgmin', '设置本地图片压缩质量')
    .option('-N, --IMGMIN', '设置全局图片压缩质量')
    .option('-m, --mode', '设置本地模式')
    .option('-N, --MODE', '设置全局模式')
    .option('-g, --create', '创建目录')
    .parse(process.argv);

switch (program.rawArgs[program.rawArgs.length - 1]) {
    case '-r':
        oneSet(color.red('[INP]') + '设置本地项目根目录(.)', 'rootPath', 'local')
        break;
    case '-R':
        oneSet(color.red('[INP]') + '设置全局项目根目录(.)', 'rootPath', 'global')
        break;
    case '-a':
        oneSet(color.red('[INP]') + '设置本地项目根目录(.)', 'name', 'local')
        break;
    case '-A':
        oneSet(color.red('[INP]') + '设置全局项目根目录(.)', 'name', 'global')
        break;
    case '-c':
        confAll('local');
        break;
    case '-C':
        confAll('global');
        break;
    case '-t':
        oneSet(color.red('[INP]') + '设置本地html目录(html)', 'htmlPath', 'local')
        break;
    case '-T':
        oneSet(color.red('[INP]') + '设置全局html目录(html)', 'htmlPath', 'global')
        break;
    case '-i':
        oneSet(color.red('[INP]') + '设置本地images目录(images)', 'imagesPath', 'local')
        break;
    case '-I':
        oneSet(color.red('[INP]') + '设置全局images目录(images)', 'imagesPath', 'global')
        break;
    case '-j':
        oneSet(color.red('[INP]') + '设置本地Jade目录(jade)', 'jadePath', 'local')
        break;
    case '-J':
        oneSet(color.red('[INP]') + '设置全局Jade目录(jade)', 'jadePath', 'global')
        break;
    case '-s':
        oneSet(color.red('[INP]') + '设置本地css输出目录(css)', 'cssPath', 'local')
        break;
    case '-S':
        oneSet(color.red('[INP]') + '设置全局css输出目录(css)', 'cssPath', 'global')
        break;
    case '-p':
        oneSet(color.red('[INP]') + '设置本地postcss目录(postcss)', 'postcssPath', 'local')
        break;
    case '-P':
        oneSet(color.red('[INP]') + '设置全局postcss目录(postcss)', 'postcssPath', 'global')
        break;
    case '-d':
        oneSet(color.red('[INP]') + '设置本地debug模式(y/n)', 'debug', 'local')
        break;
    case '-D':
        oneSet(color.red('[INP]') + '设置全局debug模式(y/n)', 'debug', 'global')
        break;
    case '-e':
        oneSet(color.red('[INP]') + '设置本地sprite前缀(icon)', 'sprite', 'local')
        break;
    case '-E':
        oneSet(color.red('[INP]') + '设置全局sprite前缀(icon)', 'sprite', 'global')
        break;
    case '-n':
        oneSet(color.red('[INP]') + '设置本地图片压缩质量(0-100)', 'imgmin', 'local')
        break;
    case '-N':
        oneSet(color.red('[INP]') + '设置全局图片压缩质量(0-100)', 'imgmin', 'global')
        break;
    case '-m':
        oneSet(color.red('[INP]') + '设置本地运行模式(y/n)', 'mode', 'local')
        break;
    case '-M':
        oneSet(color.red('[INP]') + '设置全局运行模式(y/n)', 'mode', 'global')
        break;
    case '-g':
        mkdirFn();
        break;
    default:
        // getabspath();
        break;
}





// 交互函数
var locaConfigArr = [{
    text: '您的项目名称（FEDX）:',
    key: 'name',
    value: 'FEDX',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: '是否为独立模式（Y/N）:',
    key: 'mode',
    value: true,
    type: 'boolean',
    succ: success,
    fail: function() {}
}, {
    text: '您的项目跟目录（.）:',
    key: 'rootPath',
    value: '.',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: '图片目录名称（images）:',
    key: 'imagesPath',
    value: 'images',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: 'postcss目录名称（postcss）:',
    key: 'postcssPath',
    value: 'postcss',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: 'html目录名称（html）:',
    key: 'htmlPath',
    value: 'html',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: 'css输出目录名称(css)：',
    key: 'cssPath',
    value: 'css',
    type: 'dirname',
    succ: success,
    fail: function() {}
}, {
    text: '图片压缩质量(0-100)：',
    key: 'imgMin',
    value: 70,
    type: 'number',
    succ: success,
    fail: function() {}
}, {
    text: '您是否要创建目录结构(Y/N)：',
    key: 'cdir',
    value: false,
    type: 'boolean',
    succ: success,
    fail: function() {}
}, ];

function success(key, value) {
    console.log('key: ' + key + '----' + 'value: ' + value);
}

function nextFn(arr) {
    var arg = arguments;
    if (arr.length == 0) {
        process.exit();
        return false;
    }
    var item = arr[0];
    prompt(item.text, function(c) {
        switch (item.type) {
            case 'boolean':
                if (c == 'Y' || c == 'y' || c == '') {
                    item.succ(item.key, true);
                    arr.shift();
                } else {
                    item.succ(item.key, false);
                    arr.shift();
                }
                break;
            case 'dirname':
                item.succ(item.key, c);
                arr.shift();
                break;
            case 'number':
                if (!isNaN(c)) {
                    if (c >= 100 || c == 0) {
                        item.succ(item.key, 100);
                        arr.shift();
                    } else if (c <= 50) {
                        item.succ(item.key, 50);
                        arr.shift();
                    } else {
                        item.succ(item.key, c);
                        arr.shift();
                    }
                } else {
                    console.log('请输出数字类型参数')
                }
                break;
            case 'version':
                break;
        }
        arg.callee(arr);
    })
}
// nextFn(locaConfigArr);

var set = {
    flowCur: true
}

// color
var color = {
        COLORVALUE: {
            RED: '\033[0;31m',
            GREEN: '\033[0;32m',
            YELLOW: '\033[0;33m',
            BLUE: '\033[0;34m',
            PURPLE: '\033[0;35m',
            CYAN: '\033[0;36m',
            BLACK: '\033[0;30m',
            WHITE: '\033[0;37m',
        },
        red: function(str) {
            return this.COLORVALUE.RED + str + '\033[0m'
        },
        blue: function(str) {
            return this.COLORVALUE.BLUE + str + '\033[0m'
        },
        green: function(str) {
            return this.COLORVALUE.GREEN + str + '\033[0m'
        },
        yellow: function(str) {
            return this.COLORVALUE.YELLOW + str + '\033[0m'
        },
        cyan: function(str) {
            return this.COLORVALUE.CYAN + str + '\033[0m'
        },
        purple: function(str) {
            return this.COLORVALUE.PURPLE + str + '\033[0m'
        },
        black: function(str) {
            return this.COLORVALUE.BLACK + str + '\033[0m'
        },
        white: function(str) {
            return this.COLORVALUE.WHITE + str + '\033[0m'
        },
        TIPS: function(str) {
            return this.cyan('[TIPS] ') + str
        },
        WATCH: function(str) {
            return this.green('[WATCH] ') + str
        },
        ERROR: function(str) {
            return this.red('[ERROR] ') + str
        },
        INP: function(str) {
            return this.purple('[INP] ') + str
        },
        SUCCESS: function(str) {
            return this.green('[SUCCESS] ') + str
        },
        FLOW: function(str) {
            if (set.flowCur) {
                console.log(this.cyan('[FLOW]>>> ') + str)
            }
        }
    }
    // 功能重写


var Fedx = function(option) {
    // return {
    //     init: this.init()
    // }
};

// 工具方法
// 判断文件是否存在
Fedx.prototype.isExist = function(position, file) {
    var existObj = {};
    if (position == 'local') {
        position = process.cwd();
        existObj.type = 'local'
    } else {
        position = __dirname;
        existObj.type = 'global'
    }
    var fsf = fs.access(path.join(position, file), fs.R_OK | fs.W_OK, (err) => {
        if (err) {
            existObj.exist = false;
            existObj.text = '不存在';
        } else {
            existObj.exist = true;
            existObj.text = '存在';
        }
        existObj.path = path.join(position, file);
        Qd.resolve(existObj);
    });
    return Qd.promise;
}

Fedx.prototype.fsReadFile = function(file) {
    var fileData = fs.readFileSync(file),
        fileDataJson = JSON.parse(fileData);
    return fileDataJson;
}





Fedx.prototype.uFileList = function() {}


Fedx.prototype.init = function() {

}



Fedx.prototype.init = function() {
    console.log(color.TIPS('提示'))
    console.log(color.SUCCESS('成功'))
    console.log(color.ERROR('错误'))
    console.log(color.INP('交互'))
    console.log(color.WATCH('监听'))
    color.FLOW('流')
    console.log(color.blue('blue'))
    console.log(color.red('red'))
    console.log(color.yellow('yellow'))
    console.log(color.cyan('cyan'))
    console.log(color.black('black'))
    console.log(color.white('white'))
    console.log(color.purple('purple'))
}


var FEDX = new Fedx();

// FEDX.init();

function _path(f, c) {
    var _Path = f;
    var _PathP = _Path.split(path.sep).indexOf('postcss');
    _Path[_PathP] = c;
    console.log(_Path)
    console.log(_PathP)
    _Path = path.join(path.sep);
    if (c == 'css') {
        return _Path;
    } else {

        return _Path;
    }
}

FEDX.isExist('local', 'fedxConfig.json')
    .then(function(existInfo) {
        return {
            existInfo: existInfo,
            configInfo: FEDX.fsReadFile(existInfo.path)
        }
    }).then(function(value) {
        if (value.mode) {
            console.log('zzzzz')
        }
        chokidar.watch('/Users/iuunhao/Desktop/Github/fedx-test/FEDX', { ignored: /[\/\\]\./ }).on('all', (event, f) => {
            if (event == 'change' && f.split(path.sep).indexOf('postcss') != -1) {
                var _pathObj = {
                    _cssPath: _path(f, 'css'),
                    _imgPath: _path(f, 'images')

                }
                console.log(_pathObj)

                var cnn = path.basename(f);
                var data = new Date(),
                    curHour = data.getHours() < 10 ? ('0' + data.getHours()) : data.getHours(),
                    curMinute = data.getMinutes() < 10 ? ('0' + data.getMinutes()) : data.getMinutes(),
                    curSec = data.getSeconds() < 10 ? ('0' + data.getSeconds()) : data.getSeconds(),
                    curMill = Math.ceil(data.getMilliseconds() / 10),
                    curMillis = curMill < 10 ? ('0' + curMill) : curMill;
                time = '[' + curHour + ':' + curMinute + ':' + curSec + ':' + curMillis + '] ';
                console.log(color.WATCH(color.red(time)) + f)
                fs.readFile(f, function(err, data) {
                    var st = data;
                    var processors = [
                        precss,
                        replaceImgPath,
                        sprites({
                            stylesheetPath: _pathObj._cssPath,
                            spritePath: _pathObj._imgPath,
                            spritesmith: {
                                padding: 5
                            },
                            hooks: {
                                onUpdateRule: function(rule, token, image) {
                                    var backgroundSizeX = image.spriteWidth;
                                    var backgroundSizeY = image.spriteHeight;
                                    var backgroundPositionX = image.coords.x;
                                    var backgroundPositionY = image.coords.y;
                                    backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
                                    backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
                                    backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
                                    backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

                                    var backgroundImage = postcss.decl({
                                        prop: 'background-image',
                                        value: 'url(' + image.spriteUrl + ')'
                                    });

                                    var backgroundSize = postcss.decl({
                                        prop: 'background-size',
                                        value: backgroundSizeX + 'px ' + backgroundSizeY + 'px'
                                    });

                                    var backgroundPosition = postcss.decl({
                                        prop: 'background-position',
                                        value: -backgroundPositionX + 'px ' + -backgroundPositionY + 'px'
                                    });

                                    var minSpriteWidth = postcss.decl({
                                        prop: 'width',
                                        value: image.coords.width + 'px'
                                    });

                                    var minSpriteHeight = postcss.decl({
                                        prop: 'height',
                                        value: image.coords.height + 'px'
                                    });

                                    rule.insertAfter(token, backgroundImage);
                                    rule.insertAfter(backgroundImage, backgroundPosition);
                                    rule.insertAfter(backgroundPosition, backgroundSize);
                                    rule.insertAfter(minSpriteWidth, minSpriteWidth);
                                    rule.insertAfter(minSpriteHeight, minSpriteHeight);
                                }
                            },
                            groupBy: function(image) {
                                var reg = /((icon)-?([\w]*))/;
                                if (reg.test(image.url) === -1) {
                                    return Promise.reject();
                                }
                                var a = reg.exec(image.url);
                                var c = image.url.split(path.sep);
                                patm = c[c.length - 3];
                                return Promise.resolve(c[c.length - 2]);
                            },
                            filterBy: function(image) {
                                if (!/((icon)-?([\w]*))/.test(image.url))
                                    return Promise.reject();
                                return Promise.resolve();
                            }
                        }),
                        pxtorem,
                        // mobilepx2,
                        // cssnano,
                        postcssMedia,
                        cssMqpacker({
                            sort: function(a, b) {
                                return a.localeCompare(b);
                            }
                        }),
                        autoprefixer({
                            browsers: [
                                'last 9 versions'
                            ]
                        }),
                        postcssSorting({
                            "sort-order": "yandex"
                        })
                        // opacity,
                        // crip,
                        // clean,
                    ];
                    postcss(processors)
                        .process(st, { from: f, to: path.join(_pathObj._cssPath, cnn) })
                        .then(function(result) {
                            fs.writeFileSync(path.join(_pathObj._cssPath, cnn), result.css);
                            console.log(color.green('[WATCH] ') + color.cyan(f) + ' ' + color.green(timer));
                        }, function(error) {
                            console.log(color.red('[' + 'ERROR' + ']：'))
                            console.log(color.yellow('  ［文件］：' + error.file))
                            console.log(color.yellow('  ［位置］：第' + error.line + '行' + error.column + '列'))
                            console.log(color.yellow('  ［错误］：' + error.reason))
                        }).catch();
                });
                // browserFn();

            }
        });

    })

// 生成项目文件列表
function cPList() {
    FEDX.isExist('local', 'fedxConfig.json')
        .then(function(existInfo) {
            return {
                existInfo: existInfo,
                configInfo: FEDX.fsReadFile(existInfo.path)
            }
        }).then(function(value) {
            var absPath = [
                'postcssAbsolute ',
                'htmlAbsolute ',
                'imagesAbsolute ',
                'cssAbsolute '
            ]
            var list = {
                postcssList: [],
                htmlList: [],
                imagesList: [],
                cssList: []
            }
            rd.read(value.configInfo.rootAbsolute, function(err, files) {
                if (err) throw err;
                for (var i = 0; i < files.length; i++) {
                    if (path.extname(files[i]) != '') {
                        var aa = files[i].split(path.sep)
                        if (aa.indexOf(value.configInfo.name) != -1) {
                            if (files[i].split(path.sep).indexOf('postcss') != -1)
                                list.postcssList.push(files[i])
                            if (files[i].split(path.sep).indexOf('html') != -1)
                                list.htmlList.push(files[i])
                            if (files[i].split(path.sep).indexOf('images') != -1)
                                list.imagesList.push(files[i])
                            if (files[i].split(path.sep).indexOf('css') != -1)
                                list.cssList.push(files[i])
                        }
                    }
                }

                var s = writeLineStream(fs.createWriteStream(path.join('./list.json')), {
                    newline: '\n',
                    encoding: function(data) {
                        return JSON.stringify(data);
                    },
                    cachelines: 0
                });
                s.write(list, function() {});
                s.end(function() {
                    console.log(color.TIPS('文件列表写入完成(list.json)。'))
                    process.exit();
                });

            });

        })
}

// cPList()
