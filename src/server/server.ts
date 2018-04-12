require('console-stamp')(console, { pattern: 'HH:MM:ss.l', label: true });

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';
import * as multer from 'multer';
import * as cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
var os = require('os');
var ifaces = os.networkInterfaces();
import Api from './api';

class Server {

    public app: express.Application;
    private server: http.Server;
    private io: SocketIO.Server;
    private port: string = process.env.port || '8001';
    // private upload: any;
    private clients = {};

    public static bootstrap(): Server {
        return new Server();
    }

    constructor() {
        // configure express
        this.app = express();
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
        this.app.use(express.static('./dist'));
        this.app.use(cors());
        this.app.get('/ip', (req, res) => {
            res.send(this.getIP());
        });
        this.app.get('/', (req, res, next) => {
            if (req.url.indexOf('/api') === 0) {
                return next();
            }
            res.sendFile(path.join(__dirname, 'index.html'));
        });
        this.app.use('/api', Api.createRoutes());

        // create http and socket.io server
        this.server = http.createServer(this.app);
        // this.upload = multer({ dest: 'dist/images' });
        this.io = socketIo(this.server);
        this.io.use(require('socketio-jwt').authorize({
            secret: Api.getSecret(),
            handshake: true
        }));

        // start server
        this.server.listen(this.port, () => {
            console.log('Server started on port %s', this.port);
        });

        // init socket.io
        this.io.on('connection', (socket: any) => {
            console.log('socket connected');
            Api.addUsedToken(socket.decoded_token.username);
            this.clients[socket.id] = socket;
            setInterval(
                function () {
                    socket.emit('time', new Date());
                },
                1000
            );

            let user: { username: string } | undefined;
            socket.on('login', (auth: {}) => {
                try {
                    user = this.login(auth, socket);
                    socket.emit('login', user);
                } catch (e) {
                    socket.emit('login error', { auth: auth, error: e });
                }
            });

            socket.on('logout', () => {
                console.log(user.username + ' has logged out');
                user = undefined;
            });

            socket.on('disconnect', () => {
                console.log('socket disconnected');
                user = undefined;
                Api.removeUsedToken(socket.decoded_token.username);
                delete this.clients[socket.id];
            });

            this.webRTCListeners(socket);

        });
    }

    private login(auth: any, socket: any): any {
        let notFound = true;
        let error = 'Wachtwoord onjuist';
        var users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            if (u.username === auth.username) {
                notFound = false;
            }
            if (u.username === auth.username && u.password === auth.password) {
                delete u.socketId;
                console.log(u.username + ' has logged in');
                return u;
            }
        }
        if (notFound) {
            error = 'Spelleider niet gevonden';
        }
        throw new Error(error);
    }

    private webRTCListeners(socket: any) {
        socket.on('signal', (evt: any) => {
            console.log('signalling');
            socket.broadcast.emit('signal', evt);
        });

        socket.on('offer', (evt: any) => {
            console.log('sending an offer');
            this.sendToSocket('offer', evt, evt.to);
        });

        socket.on('answer', (evt: any) => {
            console.log('sending an answer');
            this.sendToSocket('answer', evt, evt.to);
        });

        socket.on('candidate', (evt: any) => {
            console.log('sending a candidate');
            this.sendToSocket('candidate', evt, evt.to);
        });
    }

    private sendToSocket(event: string, data: any, to: string) {
        if (typeof this.clients[to] !== 'undefined') {
            this.clients[to].emit(event, data);
        }
    }

    private getIP(): string {
        let ip = '';
        Object.keys(ifaces).forEach((ifname) => {
            ifaces[ifname].forEach((iface) => {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }
                ip = iface.address;
                return;
            });
        });
        return ip;
    }
}

export default Server.bootstrap().app;