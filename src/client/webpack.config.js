var path = require('path');

module.exports = {
    mode: 'production',
    target: 'web',

    devtool: 'source-map',

    resolve: {
        extensions: ['.ts', '.tsx'],
        alias: {
            public: path.resolve(__dirname, 'public'),
            'socket.io-client': path.join( __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js')
        }
    },

    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            },
            {
                test: /\.svg$|\.html$|\.css$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        context: 'public'
                    }
                }
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },

    externals: {
        'object-assign': 'Object.assign'
    }
}
