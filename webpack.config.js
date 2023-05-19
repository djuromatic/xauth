import { fileURLToPath } from 'url';
import { dirname } from 'path';

const fileDirName = (meta) => {
  const __filename = fileURLToPath(meta.url);

  const __dirname = dirname(__filename);

  return { __dirname, __filename };
};

const { __dirname } = fileDirName(import.meta);

export default {
  mode: 'production',
  entry: './src/index.ts', // replace with your main entry file
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
