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
var atImport = require("postcss-import");


var chokidar = require('chokidar');
// 流控制
var flow = (str) => {
        if (flowCur == true)
            console.log(color.purple('[FLOW] >>> ' + str));
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

program
    .version(require('../package.json').version)
	.option('-a, --all', '编译当前目录下所有文件')
    .parse(process.argv);

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

// 交互函数
var locaConfigArr = [{
    text: '您的项目名称（FEDX）:',
    key: 'name',
    value: 'FEDX',
    type: 'dirname',

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


var Fedx = function(option) {};

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




// 自定义postcss函数函数函数函数
function mobilepx2(css) {
    flow('已开启移动端px单位除2功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
            decl.value = decl.value.replace(/(\d*\.?\d+)pm/ig, function(str) {
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
            decl.value = decl.value.replace(/(\d*\.?\d+)rm/ig, function(str) {
                return (parseFloat(str) / 100) + 'rem';
            })
        })
    });
}

// 重复字段
function str_repeat(str, num) {
    return new Array(num).join(str);
}

var i1;
// 自定义postcss插件替换路径
function replaceImgPath(css) {
    flow('已开启postcss图片相对路径处理')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
			i1 += i;
            decl.value = decl.value.replace(/url\(.*\)/, function(str) {
                var cssFile = decl.source.input.file;
                if (path.basename(cssFile) == 'common.css') {
                    var _abimg1 = abimg1.split('/');
                    var _abimgIndex = _abimg1.indexOf('images');
                    var _imgpath = _abimg1.slice(0, _abimgIndex).join('/') + '/';
                    var st = str.replace('url(../images/', '')
                    var c1 = st.split('/');
                    var c2 = c1.slice(0, c1.length - 1)
                    str = 'url(' + _imgpath + str.slice(7, str.length - 1) + ')';
                    return str;
                } else {
                    var st = str.replace('url(', '')
                    var c1 = st.split('/');
                    var c2 = c1.slice(0, c1.length - 1)
                    str = 'url(' + abimg1 + '/' + str.slice(4, str.length - 1) + ')';
                    return str;
                }

            })
        })
    });
}

function postcssMedia(css) {
    flow('已开启媒体查询识别功能')
    css.walkRules(function(rule) {
        rule.walkDecls(function(decl, i) {
			if (rule.parent.params != 'undefined') {
                var mv = rule.parent.params;
                var mtv = {
                    'iphone4': 'screen and (device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)',
                    'iphone45': 'screen and (device-width: 320px) and (-webkit-device-pixel-ratio: 2)',
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
                    case '(iphone45)':
                        return rule.parent.params = mtv.iphone45;
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
                    case 'default':
                        break;
                }
            }
        });
    });
}



function dan(){
	var abimg,
		abimg1,
		mode;
	var htmlpath;
	var roop = process.cwd();


	var roop2 = roop.split(path.sep);
	var roopl = roop2.indexOf('newStatic') + 1;
	var broo = roop2.slice(0, roopl).join(path.sep);


	chokidar.watch(broo, { ignored: /[\/\\]\./ }).on('all', (event, f) => {
		if (event == 'change' && f.split(path.sep).indexOf('postcss') != -1) {
			var reg_ = /^\_/;
			if (!reg_.test(path.basename(f))) {
				var ff = path.dirname(f);
				var _css = ff.split(path.sep);
				var _css2 = _css.indexOf('postcss');
				_css[_css2] = 'css';
				_css = _css.slice(0, _css.length)
				var _cssPath = _css.join(path.sep);


				var _img = f.split(path.sep);
				var _img2 = _img.indexOf('postcss');
				_img[_img2] = 'images';
				var _imgPath = _img.join(path.sep);
				var cnn1 = path.basename(f);
				var cnn2 = cnn1.split('.css');
				var arrpath = path.dirname(f).split(path.sep);
				var regv = /(v\d)(\.\d)+/;
				if (regv.test(arrpath)) {
					var cnn = cnn2[0] + '_' + path.basename(arrpath.join(path.sep)) + path.extname(cnn1);
				} else {
					var cnn = cnn2[0] + path.extname(cnn1);
				}
				_imgPath = path.dirname(_img.join(path.sep));



				// html
				// console.log('html------------------------------')

				// _htmlPath = _cssPath.split(path.sep);
				// var _htmlLen = _htmlPath.indexOf('css');
				// _htmlPath[_htmlLen] = 'html';


				// for (var a = 0; a < _htmlPath.length; a++) {
				//     switch (_htmlPath[a]) {
				//         case 'weixin':
				//             _htmlPath[a] = '微信';
				//             break;
				//     }
				// }
				// var htmlpath = _htmlPath.join(path.sep);
				// console.log(htmlpath)

				// console.log('html------------------------------')

				var mo = f.split(path.sep);
				if (mo.indexOf('mobile') != -1) {
					mode = 2;
				} else {
					mode = 1;
				};

				abimg = path.relative(path.dirname(f), path.dirname(_img.join(path.sep)))
				abimg1 = path.relative(_cssPath, path.dirname(_img.join(path.sep)))


				var data = new Date(),
					curHour = data.getHours() < 10 ? ('0' + data.getHours()) : data.getHours(),
					curMinute = data.getMinutes() < 10 ? ('0' + data.getMinutes()) : data.getMinutes(),
					curSec = data.getSeconds() < 10 ? ('0' + data.getSeconds()) : data.getSeconds(),
					curMill = Math.ceil(data.getMilliseconds() / 10),
					curMillis = curMill < 10 ? ('0' + curMill) : curMill;
				time = '[' + curHour + ':' + curMinute + ':' + curSec + ':' + curMillis + '] ';
				console.log(color.WATCH(color.red(time)) + f)
				console.log(color.TIPS(color.red('[ 输出位置 ] ')) + path.join(_cssPath, cnn))
				fs.readFile(f, function(err, data) {
					var st = data;
					var processors = [
						atImport,
						replaceImgPath,
						precss,
						 autoprefixer({
							browsers: [
								'last 9 versions'
							]
						}),
						sprites({
							stylesheetPath: _cssPath,
							spritePath: _imgPath,
							spritesmith: {
								padding: 5
							},
							hooks: {
								onUpdateRule: function(rule, token, image) {
									var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
									var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
									var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
									var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

									backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX.toFixed(3);
									backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY.toFixed(3);
									backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX.toFixed(3);
									backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY.toFixed(3);

									var backgroundImage = postcss.decl({
										prop: 'background-image',
										value: 'url(' + image.spriteUrl + ')'
									});

									var backgroundSize = postcss.decl({
										prop: 'background-size',
										value: backgroundSizeX + '% ' + backgroundSizeY + '%'
									});

									var backgroundPosition = postcss.decl({
										prop: 'background-position',
										value: backgroundPositionX + '% ' + backgroundPositionY + '%'
									});

									var minSpriteWidth = postcss.decl({
										prop: 'width',
										value: (image.coords.width / mode) + 'px'
									});

									var minSpriteHeight = postcss.decl({
										prop: 'height',
										value: (image.coords.height / mode) + 'px'
									});
									var norepeat = postcss.decl({
										prop: 'background-repeat',
										value: 'no-repeat'
									});

									rule.insertAfter(token, backgroundImage);
									rule.insertAfter(backgroundImage, backgroundPosition);
									rule.insertAfter(backgroundPosition, backgroundSize);
									rule.insertAfter(minSpriteWidth, minSpriteWidth);
									rule.insertAfter(minSpriteHeight, minSpriteHeight);
									rule.insertAfter(minSpriteHeight, minSpriteHeight);
									rule.insertAfter(norepeat, norepeat);
								}
							},
							groupBy: function(image) {
								var reg = /((icon)-?([\w]*))/;
								if (reg.test(image.url) === -1) {
									return Promise.reject();
								}
								var a = reg.exec(image.url);
								var c = image.url.split('/');
								return Promise.resolve(c[c.length - 3]);
							},
							filterBy: function(image) {
								if (!/((icon)-?([\w]*))/.test(image.url))
									return Promise.reject();
								return Promise.resolve();
							}
						}),
						pxtorem,
						mobilepx2,
						cssnano,
						postcssMedia,
						cssMqpacker({
							sort: function(a, b) {
								return a.localeCompare(b);
							}
						}),

						postcssSorting({
							"sort-order": "yandex"
						})
						// opacity,
						// crip,
						// clean,
					];
					postcss(processors)
						.process(st, { from: f, to: path.join(_cssPath, cnn) })
						.then(function(result) {
							fs.writeFileSync(path.join(_cssPath, cnn), result.css);
						}, function(error) {
							console.log(color.red('[' + 'ERROR' + ']：'))
							console.log(color.yellow('  ［文件］：' + error.file))
							console.log(color.yellow('  ［位置］：第' + error.line + '行' + error.column + '列'))
							console.log(color.yellow('  ［错误］：' + error.reason))
						}).catch();
				});
			}

		}
	});

}


function all(){
	var abimg,
		abimg1,
		mode;
	var htmlpath;
	var roop = process.cwd();
	var roop2 = roop.split(path.sep);
	if((roop2.indexOf('newStatic') != -1) && (roop2.indexOf('postcss') != -1)){
		chokidar.watch(roop, { ignored: /[\/\\]\./}).on('all', (event, f) => {
			if (f.split(path.sep).indexOf('postcss') != -1) {
				var reg_ = /^\_/;
				if (!reg_.test(path.basename(f))) {
					var ff = path.dirname(f);
					var _css = ff.split(path.sep);
					var _css2 = _css.indexOf('postcss');
					_css[_css2] = 'css';
					_css = _css.slice(0, _css.length)
					var _cssPath = _css.join(path.sep);


					var _img = f.split(path.sep);
					var _img2 = _img.indexOf('postcss');
					_img[_img2] = 'images';
					var _imgPath = _img.join(path.sep);
					var cnn1 = path.basename(f);
					var cnn2 = cnn1.split('.css');
					var arrpath = path.dirname(f).split(path.sep);
					var regv = /(v\d)(\.\d)+/;
					if (regv.test(arrpath)) {
						var cnn = cnn2[0] + '_' + path.basename(arrpath.join(path.sep)) + path.extname(cnn1);
					} else {
						var cnn = cnn2[0] + path.extname(cnn1);
					}
					_imgPath = path.dirname(_img.join(path.sep));



					// html
					// console.log('html------------------------------')

					// _htmlPath = _cssPath.split(path.sep);
					// var _htmlLen = _htmlPath.indexOf('css');
					// _htmlPath[_htmlLen] = 'html';


					// for (var a = 0; a < _htmlPath.length; a++) {
					//     switch (_htmlPath[a]) {
					//         case 'weixin':
					//             _htmlPath[a] = '微信';
					//             break;
					//     }
					// }
					// var htmlpath = _htmlPath.join(path.sep);
					// console.log(htmlpath)

					// console.log('html------------------------------')

					var mo = f.split(path.sep);
					if (mo.indexOf('mobile') != -1) {
						mode = 2;
					} else {
						mode = 1;
					};

					abimg = path.relative(path.dirname(f), path.dirname(_img.join(path.sep)))
					abimg1 = path.relative(_cssPath, path.dirname(_img.join(path.sep)))


					var data = new Date(),
						curHour = data.getHours() < 10 ? ('0' + data.getHours()) : data.getHours(),
						curMinute = data.getMinutes() < 10 ? ('0' + data.getMinutes()) : data.getMinutes(),
						curSec = data.getSeconds() < 10 ? ('0' + data.getSeconds()) : data.getSeconds(),
						curMill = Math.ceil(data.getMilliseconds() / 10),
						curMillis = curMill < 10 ? ('0' + curMill) : curMill;
					time = '[' + curHour + ':' + curMinute + ':' + curSec + ':' + curMillis + '] ';
					console.log(color.WATCH(color.red(time)) + f)
					console.log(color.TIPS(color.red('[ 输出位置 ] ')) + path.join(_cssPath, cnn))
					fs.readFile(f, function(err, data) {
						var st = data;
						var processors = [
							atImport,
							replaceImgPath,
							precss,
							 autoprefixer({
								browsers: [
									'last 9 versions'
								]
							}),
							sprites({
								stylesheetPath: _cssPath,
								spritePath: _imgPath,
								spritesmith: {
									padding: 5
								},
								hooks: {
									onUpdateRule: function(rule, token, image) {
										var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
										var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
										var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
										var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

										backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX.toFixed(3);
										backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY.toFixed(3);
										backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX.toFixed(3);
										backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY.toFixed(3);

										var backgroundImage = postcss.decl({
											prop: 'background-image',
											value: 'url(' + image.spriteUrl + ')'
										});

										var backgroundSize = postcss.decl({
											prop: 'background-size',
											value: backgroundSizeX + '% ' + backgroundSizeY + '%'
										});

										var backgroundPosition = postcss.decl({
											prop: 'background-position',
											value: backgroundPositionX + '% ' + backgroundPositionY + '%'
										});

										var minSpriteWidth = postcss.decl({
											prop: 'width',
											value: (image.coords.width / mode) + 'px'
										});

										var minSpriteHeight = postcss.decl({
											prop: 'height',
											value: (image.coords.height / mode) + 'px'
										});
										var norepeat = postcss.decl({
											prop: 'background-repeat',
											value: 'no-repeat'
										});

										rule.insertAfter(token, backgroundImage);
										rule.insertAfter(backgroundImage, backgroundPosition);
										rule.insertAfter(backgroundPosition, backgroundSize);
										rule.insertAfter(minSpriteWidth, minSpriteWidth);
										rule.insertAfter(minSpriteHeight, minSpriteHeight);
										rule.insertAfter(minSpriteHeight, minSpriteHeight);
										rule.insertAfter(norepeat, norepeat);
									}
								},
								groupBy: function(image) {
									var reg = /((icon)-?([\w]*))/;
									if (reg.test(image.url) === -1) {
										return Promise.reject();
									}
									var a = reg.exec(image.url);
									var c = image.url.split('/');
									return Promise.resolve(c[c.length - 3]);
								},
								filterBy: function(image) {
									if (!/((icon)-?([\w]*))/.test(image.url))
										return Promise.reject();
									return Promise.resolve();
								}
							}),
							pxtorem,
							mobilepx2,
							cssnano,
							postcssMedia,
							cssMqpacker({
								sort: function(a, b) {
									return a.localeCompare(b);
								}
							}),

							postcssSorting({
								"sort-order": "yandex"
							})
							// opacity,
							// crip,
							// clean,
						];
						postcss(processors)
							.process(st, { from: f, to: path.join(_cssPath, cnn) })
							.then(function(result) {
								fs.writeFileSync(path.join(_cssPath, cnn), result.css);
							}, function(error) {
								console.log(color.red('[' + 'ERROR' + ']：'))
								console.log(color.yellow('  ［文件］：' + error.file))
								console.log(color.yellow('  ［位置］：第' + error.line + '行' + error.column + '列'))
								console.log(color.yellow('  ［错误］：' + error.reason))
							}).catch();
					});
				}

			}
		});
	}else{
		console.log(color.ERROR(color.blue('请确保您的命令运行路径中包含newStatic & postcss目录')))
		process.exit();
	}

}

switch (program.rawArgs[program.rawArgs.length - 1]) {
    case '-a':
		var pa = process.cwd();
		prompt(color.cyan('[INP]：') + '你是否要编译\n' + color.red(pa) + '\n目录下的'+ color.red('所有文件') +'吗？(y/n)：', (c) => {
			if (c == 'y' || c == 'Y') {
				all();
			}
		})
    default:
		dan();
}

