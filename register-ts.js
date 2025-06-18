const { register } = require('ts-node');
const tsconfig = require('./tsconfig.node.json');
const tsConfigPaths = require('tsconfig-paths');

// Đảm bảo babel polyfill được đăng ký khi cần thiết
try {
  require('@babel/register');
} catch (e) {
  console.log('Babel register not available, continuing...');
}

register({
  transpileOnly: true,
  compilerOptions: {
    ...tsconfig.compilerOptions,
    module: 'commonjs',
    moduleResolution: 'node',
  },
});

// Đăng ký paths từ tsconfig
if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  tsConfigPaths.register({
    baseUrl: './',
    paths: tsconfig.compilerOptions.paths
  });
}