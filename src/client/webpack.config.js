var path = require('path');

module.exports = {
    mode: "production",

    devtool: "source-map",

    resolve: {
        extensions: [".ts", ".tsx"],
        alias: {
            'socket.io-client': path.join( __dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js')
        }
    },

    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.svg$|\.html$|\.css$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]'
                    }
                }
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            }
        ]
    },

    externals: {
        "object-assign": "Object.assign"
    }
}
