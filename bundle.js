const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');
const babel = require('@babel/core');

// 第一步：获取模块内容
const getFileContent = (filePath) => {
	const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
	// console.log(content);
	return content;
}

// 第二步：获取解析模块
const parseModule = (content) => {
	const ast = parser.parse(content, { sourceType: 'module' });
	// console.log(ast.program.body);
	return ast;
}

// 第三步：收集依赖
const collectDeps = (ast, filePath) => {
	const deps = {}
	traverse(ast, {
		ImportDeclaration({node}){
			const dirname = path.dirname(filePath);
			const value = node.source.value.includes('.js') ? node.source.value : node.source.value + '.js';
			const absoultePath = './' + path.join(dirname, value);
			deps[node.source.value] = absoultePath;
			// console.log(absoultePath);
		}
	});
	return deps;
}

// 第四步：语法降级(ES6 -> ES5)
const transform = (ast) => {
	const { code } = babel.transformFromAst(ast, null, { presets: ['@babel/preset-env'] });
	// console.log(code);
	return code;
}

// 第五步：递归获取所有依赖
const getModuleInfo = (filePath) => {
	const content = getFileContent(filePath);
	const ast = parseModule(content);
	const deps = collectDeps(ast, filePath);
	const code = transform(ast);
	return { filePath, deps, code };
}
const parseModules = (filePath) => {
	const entry = getModuleInfo(filePath);
	const files = [entry];
	for(let i = 0; i < files.length; i++) {
		const { deps }= files[i];
		deps && Object.keys(deps).forEach((key) => files.push(parseModules(deps[key])));
	}
	return files.flat(Infinity);
}

// 第六步：合并代码、处理两个关键字
const handleModules = (files) => {
	return files.reduce((a,c) => {
		const { filePath, ...rest} = c;
		a[filePath] = rest; 
		return a;
	},{});
}

const bundle = (filePath) => {
	const files = parseModules(filePath);
	const modules = handleModules(files);
	const codeGraph = JSON.stringify(modules);
	const code = `
		(function(graph){
			function require(file){
				function absoluteRequire(relativePath) {
					return require(graph[file].deps[relativePath]);
				}
				var exports = {};
				(function(require, exports, code){
					eval(code);
				})(absoluteRequire, exports, graph[file].code)
				return exports;
			}
			require('${filePath}');
		})(${codeGraph});
	`
	return code;
}

const filePath = './src/index.js';
// fs.mkdirSync('./dist');
fs.writeFileSync('./dist/bundle.js', bundle(filePath));