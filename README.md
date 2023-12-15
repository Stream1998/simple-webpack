# simple-webpack

目的：了解 webpack 核心原理。

## webpack 的打包流程

 1. 获取入口文件内容
 2. 生成 `AST`：使用 `@babel/parser` 将代码转换为 AST。
 3. 遍历 `AST`, 收集依赖：使用 `@babel/traverse` 遍历 AST, 处理 `ImportDeclaration` 节点，得到依赖路径。
 4. 语法降级(`ES6` => `ES5`)：使用 `@babel/core`、`@babel/preset-env` 进行代码转换
 5. 递归获取所有依赖
 6. 合并所有代码，生成代码映射，实现 `require`、`exports` 等关键字。
 7. 生成打包文件。
