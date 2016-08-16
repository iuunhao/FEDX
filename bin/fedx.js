#!/usr/bin/env node

var program = require('commander'),
	Promise = require("bluebird"),
	fs = require('fs'),
	path = require("path"),
	postcss = require('postcss'),
	autoprefixer = require('autoprefixer'),
	cssnano = require('cssnano'),
	precss = require('precss'),
	postcssSorting = require('postcss-sorting'),
	cssMqpacker = require('css-mqpacker'),
	spritesmith = require('spritesmith'),
	sprites = require('postcss-sprites').default,
	updateRule = require('postcss-sprites').updateRule,
	browserSync = require('browser-sync'),
	readdirp = require('readdirp'),
	rd = require('rd'),
	request = require('request'),
	ip = require('ip'),
	ipn = ip.address(),
	atImport = require("postcss-import"),
	os = require("os"),
	chokidar = require('chokidar'),
	mkdir = require('mkdir-p');


program
	.version(require('../package.json').version)
	.usage('[options] [Pattern type]')
	.option('-a, --all ', '编译之前版本')
	.parse(process.argv);
// var pname = program.args[0]




// 配置
var config = {
	flowCur: false,
	ignor: [
		/node_modules/,
		/[\/\\]\./
	],
	limit: false,
	tipNum: 1000
}

var bs = require("browser-sync").create(),
	abimg1,
	mode;

// 颜色
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
	}
}

// 流控制
var flow = (str) => {
	if (!!config.flowCur)
		console.log(color.yellow('[FLOW] >>> ' + str));
}

var tipsFn = function(callback) {
	if (!config.limit) {
		callback();
	}
}




// 交互

// var prompt = require('prompt');
// prompt.start();

// var schema = {
//     properties: {
//         name: {
//             pattern: /^\d/,
//             message: 'Name must be only letters, spaces, or dashes',
//             required: true
//         },
//         password: {
//             hidden: true
//         }
//     }
// };
// prompt.get(schema, function(err, result) {
//     console.log('Command-line input received:');
//     console.log('  name: ' + result.name);
//     console.log('  password: ' + result.password);
// });



// 参数判断
// switch (program.rawArgs[program.rawArgs.length - 1]) {
//     case '-a':
//         var pa = process.cwd();
//         prompt(color.cyan('[INP]：') + '你是否要编译\n' + color.red(pa) + '\n目录下的' + color.red('所有文件') + '吗？(y/n)：', (c) => {
//             if (c == 'y' || c == 'Y') {
//                 all();
//             }
//         })
//     case '-m':
//     case '-c':
//     default:
//         dan();
// }

// 工具方法
var Fedx = function() {};
var FEDX = new Fedx();
// 检测文件是否存在
Fedx.prototype.isExist = function() {}

// 读取文件
Fedx.prototype.fsReadFile = function(file, type) {
		var fileData = fs.readFileSync(file);
		switch (type) {
			case "json":
				return fileDataJson = JSON.parse(fileData);
			case "string":
				return fileData;
		}
	}
	// 写文件
Fedx.prototype.fsWriteFile = function(file, data, cur) {
		fs.writeFile(file, data, (err) => {
			if (err) throw err;
			if (!!cur)
				console.log(data);
		});
	}
	// 创建目录
Fedx.prototype.mkdirs = function(path, callback) {
	var dirs = path.slice(1).split("/"),
		i = 0;
	var mk = function(err) {
		i += 1;
		if (i > dirs.length) {
			callback(err);
			return;
		}
		fs.mkdir('/' + dirs.slice(0, i).join('/'), function(err) {
			mk(err);
		});
	};
	mk();
}


var getConfig = FEDX.fsReadFile(path.join(__dirname, '../fedxConfig.json'), 'json');

// 时间
Fedx.prototype.tipsTime = function() {
		var data = new Date(),
			curHour = data.getHours() < 10 ? ('0' + data.getHours()) : data.getHours(),
			curMinute = data.getMinutes() < 10 ? ('0' + data.getMinutes()) : data.getMinutes(),
			curSec = data.getSeconds() < 10 ? ('0' + data.getSeconds()) : data.getSeconds(),
			curMill = Math.ceil(data.getMilliseconds() / 10),
			curMillis = curMill < 9 ? ('0' + curMill) : curMill;
		return '[' + color.white(curMinute + ':' + curSec + ':' + curMillis) + '] ';
	}
	// 裁剪路径
Fedx.prototype.slicePath = function(f, str) {
		var _pathArr = f.split(path.sep),
			_pathIndex = _pathArr.indexOf(str);
		return _pathArr.slice(_pathIndex, _pathArr.length).join(path.sep);
	}
	// 替换路径
Fedx.prototype.replacePath = function(f, str) {
		var _pathArr = f.split(path.sep),
			_pathIndex = _pathArr.indexOf(getConfig.path.postcssPath);
		_pathArr[_pathIndex] = str;
		return path.dirname(_pathArr.join(path.sep));
	}
	// 对象拷贝
Fedx.prototype.deepCopy = function(source) {
	var deepCopy = function(source) {
		var result = {};
		for (var key in source) {
			result[key] = typeof source[key] === 'object' ? deepCoyp(source[key]) : source[key];
		}
		return result;
	}
}

// 计算tips显示次数
Fedx.prototype.tipsNumber = function() {
	if (getConfig.tipNumber <= config.tipNum) {
		tipsFn(function() {
			// console.log(Array(100).join('='));
			// console.log(color.green('\t' + '为了让大家更快熟悉编译流程， 在部分环节做了提示性操作， 使用一段时间， 将会自动消失 '));
		})
		var _deepCopy = getConfig;
		_deepCopy.tipNumber++;
		FEDX.fsWriteFile(path.join(__dirname, '../fedxConfig.json'), JSON.stringify(_deepCopy), false);
	} else {
		config.limit = true
	}
}
FEDX.tipsNumber();
Fedx.prototype.replacePath = function(f, str) {
	var _pathArr = f.split(path.sep),
		_pathIndex = _pathArr.indexOf(getConfig.path.postcssPath);
	_pathArr[_pathIndex] = str;
	return path.dirname(_pathArr.join(path.sep));
}

// html路径查找
Fedx.prototype.htmlPath = function(f, str) {
	var f = path.dirname(f),
		_pathArr = f.split(path.sep),
		indedx = _pathArr.indexOf(getConfig.path.postcssPath);
	_pathArr[indedx] = getConfig.path.htmlPath;
	switch (_pathArr[indedx + 1]) {
		case "weixin":
			_pathArr[indedx + 1] = '微信';
			_pathArr = _pathArr.slice(0, indedx + 2);
			htmlP();
			break;
		case "gupiao":
			_pathArr[indedx + 1] = '股票';
			_pathArr = _pathArr.slice(0, indedx + 2);
			htmlP();
			break;
		case "extension":
			_pathArr[indedx + 1] = '活动';
			_pathArr = _pathArr.slice(0, indedx + 2);
			htmlP();
			break;
		case "lianchu":
			_pathArr[indedx + 1] = '联储';
			_pathArr = _pathArr.slice(0, indedx + 2);
			htmlP();
			break;
		case "mirroring":
			_pathArr[indedx + 1] = '镜像';
			_pathArr = _pathArr.slice(0, indedx + 2);
			htmlP();
			break;
		default:
			console.log('由于当前项目属于新类型项目，无法获取html路径。');
			break;
	}


	function htmlP() {
		console.log('\n' + color.TIPS(':我找到以下文件与您当前修改的样式文件匹配') + '\n');
		bs.watch(process.cwd() + '**/*', function(event, file) {
			bs.reload()
		});
		console.log(_pathArr.join(path.sep))
		rd.eachSync(_pathArr.join(path.sep), function(file, s) {
			if (path.extname(file) == '.html') {
				var strHtml = FEDX.fsReadFile(file, 'string').toString(),
					reg = new RegExp(s);
				if (reg.test(strHtml)) {
					var itemFileName = file.split(path.sep),
						itemIndex = itemFileName.indexOf(getConfig.path.rootPath);
					if (os.platform() != "win32") {
						var serverScile = itemFileName.slice(itemIndex + 2, itemFileName.length).join(path.sep);
					} else {
						var serverScile = itemFileName.slice(itemIndex + 1, itemFileName.length).join(path.sep);
					}
					serverScile.replace(/\\/, '/');
					console.log('http://' + ipn + ':' + 3000 + '/' + serverScile)
					console.log(Array(file.length + 20).join('-'));
				}
			}
		});
	}
}




// 文件添加版本号
Fedx.prototype.addFileVersion = function(f) {
	var fileName = path.basename(f, '.css'),
		_pathArr = path.dirname(f).split(path.sep),
		regv = /(v\d)(\.\d)+/;
	if (regv.test(_pathArr)) {
		return fileName + '_' + path.basename(_pathArr.join(path.sep)) + '.css'
	} else {
		return path.basename(f)
	}
}



// 自定义postcss函数函数函数函数
Fedx.prototype.mobilepx2 = function(css) {
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
Fedx.prototype.pxtorem = function(css) {
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
Fedx.prototype.str_repeat = function(str, num) {
	return new Array(num).join(str);
}

function mkdirfedx(dirpath, dirname) {
	//判断是否是第一次调用  
	if (typeof dirname === "undefined") {
		if (fs.existsSync(dirpath)) {
			return;
		} else {
			mkdir(dirpath, path.dirname(dirpath));
		}
	} else {
		//判断第二个参数是否正常，避免调用时传入错误参数  
		if (dirname !== path.dirname(dirpath)) {
			mkdir(dirpath);
			return;
		}
		if (fs.existsSync(dirname)) {
			fs.mkdirSync(dirpath)
		} else {
			mkdir(dirname, path.dirname(dirname));
			fs.mkdirSync(dirpath);
		}
	}
}

// 自定义postcss插件替换路径
Fedx.prototype.replaceImgPath = function(css) {
		flow('已开启postcss图片相对路径处理')
		css.walkRules(function(rule) {
			rule.walkDecls(function(decl, i) {
				decl.value = decl.value.replace(/url\(.*\)/, function(str) {
					var rega = /\.\.\//;
					if (!rega.test(str)) {
						var st = str.replace('url(', '')
						var c1 = st.split('/');
						var c2 = c1.slice(0, c1.length - 1)
						var l_str = abimg1.split(path.sep);
						var l_index = l_str.indexOf('images');
						var l_c_str = l_str.slice(0, l_index + 1).join('/');
						if (program.all) {
							str = 'url(' + abimg1 + '/' + str.slice(4, str.length - 1) + ')';
							return str;
						} else {
							str = 'url(' + l_c_str + '/' + str.slice(4, str.length - 1) + ')';
							return str;
						}
					} else {
						return str;
					}
				})
			})
		});
	}
	// 媒体查询简写
Fedx.prototype.postcssMedia = function(css) {
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



function postcssBuild(fe) {
	if (!(new RegExp(/^\_/)).test(path.basename(fe))) {
		var pathSplit = fe.split(path.sep),
			_cssPath = FEDX.replacePath(fe, 'css'),
			_imgPath = FEDX.replacePath(fe, 'images'),
			cnn = FEDX.addFileVersion(fe);
		mode = (new RegExp(getConfig.type.mobile).test(pathSplit)) ? 2 : 1;
		abimg1 = path.relative(_cssPath, _imgPath);
		var cssStr = FEDX.fsReadFile(fe, 'string');
		var processors = [
			atImport,
			FEDX.replaceImgPath,
			precss,
			autoprefixer({
				browsers: [
					'last 9 versions'
				]
			}),
			sprites(spritesOption(_cssPath, _imgPath)),
			FEDX.pxtorem,
			FEDX.mobilepx2,
			cssnano,
			FEDX.postcssMedia,
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
			.process(cssStr, {
				from: fe,
				to: path.join(_cssPath, cnn)
			})
			.then(function(result) {
				mkdir(_cssPath, function(err) {
					if (err) {
						console.log(err);
					} else {
						fs.writeFileSync(path.join(_cssPath, cnn), result.css);
					}
				});
			}, function(error) {
				console.log(color.red('[' + 'ERROR' + ']：'))
				console.log(color.red(error.message))
			}).catch();
		console.log(color.green('output') + '\t' + color.green(path.join(_cssPath, cnn)));
		var leng = color.purple('output') + '\t' + path.join(_cssPath, cnn);
		console.log(Array(leng.length - 9).join('-'))

	}
};

function spritesOption(csspath, imgpath) {
	return {
		stylesheetPath: csspath,
		spritePath: imgpath,
		spritesmith: {
			padding: 10
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
			if (program.all) {
				var nameSlice = c[c.length - 3] + c[c.length - 2];
				return Promise.resolve(nameSlice.replace(/icon/, ''));
			} else {
				var nameSlice = c[c.length - 3];
				var nameSlice2 = c[c.length - 2];
				var outname = nameSlice + '.' + nameSlice2;
				return Promise.resolve(outname.replace(/icon-/, ''));
			}
		},
		filterBy: function(image) {
			if (!/((icon)-?([\w]*))/.test(image.url))
				return Promise.reject();
			return Promise.resolve();
		}
	}
}

function build() {
	flow('读取配置文件');
	var curPath = process.cwd();
	var _path = curPath.split(path.sep);


	flow('判断运行目录是否为跟目录');
	if (new RegExp(getConfig.path.rootPath).test(_path)) {
		flow('监听文件');
		chokidar.watch(process.cwd(), {
			ignored: config.ignor
		}).on('all', (event, f) => {
			var _event = event;
			if (event == 'change') {
				var arrF = f.split(path.sep);
				if (path.extname(f) == '.css' && event == 'change' && (arrF.indexOf(getConfig.path.postcssPath) != -1)) {
					var _htmlcssPath = f;
					var le = _htmlcssPath.split(path.sep);
					var aa = le.indexOf(getConfig.path.rootPath);
					var _cssHtmlStr = le.slice([aa + 2], le.length).join(path.sep);
					// FEDX.htmlPath(f, _cssHtmlStr)
				}
				var changeFile = f.split(path.sep);
				if (new RegExp(getConfig.path.postcssPath).test(changeFile)) {
					changeFile = f.split(path.sep);
					var allFile = f;
					var watchPathIndex = changeFile.indexOf(getConfig.path.postcssPath) + 3;
					var watchPath = changeFile.slice(0, watchPathIndex).join(path.sep);
					rd.eachSync(path.join(watchPath), function(fe, s) {
						if (path.extname(fe) == '.css') {
							if (fe == allFile) {
								console.log(color.yellow(event + '\t' + fe))
							} else {
								if (!RegExp(/^\_/).test(path.basename(fe, '.css'))) {
									console.log(color.blue('Build') + '\t' + color.blue(fe))
								}
							}
							postcssBuild(fe)
						}
					})

					console.log("\n\n\n");
				}
			}
		})
	} else {
		console.log(color.ERROR('请在' + color.red('[ ' + getConfig.path.rootPath + ' ]')) + '目录下运行命令！');
	}
}
build()


var cwdArr = process.cwd().split(path.sep);
var serverRoot = cwdArr.slice(0, cwdArr.indexOf(getConfig.path.rootPath) + 2).join('/');

bs.init({
	server: {
		baseDir: serverRoot,
		directory: true
	},
	open: false
});
