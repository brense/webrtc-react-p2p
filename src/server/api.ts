import * as express from 'express';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

export default class Api {

    private static secret: string = 'aojrlZGQp58JoIeX';
    private static usedTokens: string[] = [];

    public static getSecret(): string {
        return Api.secret;
    }

    public static addUsedToken(token: string) {
        Api.usedTokens.push(token);
    }

    public static removeUsedToken(token: string) {
        Api.usedTokens.splice(Api.usedTokens.indexOf(token), 1);
    }

    public static createRoutes(): express.Router {
        const router = express.Router();
        router.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.log('api works');
            res.send('api works');
        });

        router.post('/login', (req, res) => {
            if (typeof req.body.username !== 'undefined' && typeof req.body.password !== 'undefined') {
                let found = false;
                let user: any = undefined;
                let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
                users.some((u: any, k: number) => {
                    if (users[k].username === req.body.username) {
                        found = true;
                    }
                    if (users[k].username === req.body.username && users[k].password === req.body.password) {
                        user = users[k];
                        return true;
                    }
                    return false;
                });
                if (found && typeof user !== 'undefined') {
                    const token = jwt.sign(
                        { username: user.username, password: user.password },
                        Api.secret,
                        { expiresIn: '1h' }
                    );
                    if (Api.usedTokens.indexOf(user.username) > -1) {
                        res.status(401).send('User already logged in');
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ user: user, token: token }));
                    }
                } else if (found) {
                    res.status(401).send('Password incorrect');
                } else {
                    res.status(401).send('User not found');
                }
            }
        });

        router.get('/user', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
            for (let user of users) {
                delete user.password;
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(users));
        });

        router.put('/user', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('updating user');
            if (typeof req.body.username !== 'undefined') {
                let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
                let k: number;
                let user = req.body;
                if (typeof user.password !== 'undefined' && user.password !== user.passwordCompare) {
                    res.sendStatus(400);
                    return console.log(user);
                }
                delete user.passwordCompare;
                delete user.socketId;
                let found = false;
                for (let i in users) {
                    if (users[i].username === user.username) {
                        found = true;
                        user.some((v, key: string) => {
                            users[i][key] = user[key];
                        });
                        k = +i;
                        break;
                    }
                }
                if (!found) {
                    k = users.length;
                    users.push(user);
                }
                fs.writeFile('data/users.json', JSON.stringify(users), (err) => {
                    if (err) {
                        res.sendStatus(500);
                        return console.log(err);
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ index: k, user: user })); // ? why?
                });
            }
        });

        router.delete('/user/:username', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('deleting user');
            let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
            let newUsers: any[] = [];
            for (let i in users) {
                if (users[i].username !== req.params.username) {
                    newUsers.push(users[i]);
                }
            }
            fs.writeFile('data/users.json', JSON.stringify(newUsers), (err) => {
                if (err) {
                    res.sendStatus(500);
                    return console.log(err);
                }
                res.sendStatus(200);
            });
        });

        router.delete('/user', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('deleting users');
            const usernames = req.query.usernames.split(',');
            let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
            let newUsers: any[] = [];
            for (let i in users) {
                if (usernames.indexOf(users[i].username) === -1) {
                    newUsers.push(users[i]);
                }
            }
            fs.writeFile('data/users.json', JSON.stringify(newUsers), (err) => {
                if (err) {
                    res.sendStatus(500);
                    return console.log(err);
                }
                res.sendStatus(200);
            });
        });

        router.post('/user/reset', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('resetting user password');
            let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
            let user = req.body;
            user.password = Math.random().toString(36).slice(-8);
            for (let i in users) {
                if (users[i].username === user.username) {
                    users[i] = user;
                }
            }
            fs.writeFile('data/users.json', JSON.stringify(users), (err) => {
                if (err) {
                    res.sendStatus(500);
                    return console.log(err);
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(user.password));
            });
        });

        router.get('/game', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            let games = JSON.parse(fs.readFileSync('data/games.json', 'utf8'));
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(games));
        });

        router.put('/game', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('updating game');
            if (typeof req.body.hash !== 'undefined') {
                let games = JSON.parse(fs.readFileSync('data/games.json', 'utf8'));
                let k: number;
                let game = req.body;
                let found = false;
                for (let i in games) {
                    if (games[i].hash === game.hash) {
                        found = true;
                        games[i] = game;
                        k = +i;
                    }
                }
                if (!found) {
                    games.push(game);
                    k = games.length - 1;
                }
                fs.writeFile('data/games.json', JSON.stringify(games), (err) => {
                    if (err) {
                        res.sendStatus(500);
                        return console.log(err);
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ index: k, game: game }));
                });
            }
        });

        router.delete('/game/:hash', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('deleting game');
            var games = JSON.parse(fs.readFileSync('data/games.json', 'utf8'));
            var newGames: any[] = [];
            for (var i in games) {
                if (games[i].hash !== req.params.hash) {
                    newGames.push(games[i]);
                }
            }
            var scenarios = JSON.parse(fs.readFileSync('data/scenarios.json', 'utf8'));
            var newScenarios: any[] = [];
            scenarios.forEach((scenario) => {
                if (scenario.game !== req.params.hash) {
                    newScenarios.push(scenario);
                }
            });
            fs.writeFile('data/scenarios.json', JSON.stringify(newScenarios), (err) => {
                if (err) {
                    res.sendStatus(500);
                    return console.log(err);
                }
            });
            fs.writeFile('data/games.json', JSON.stringify(newGames), (err) => {
                if (err) {
                    res.sendStatus(500);
                    return console.log(err);
                }
                res.sendStatus(200);
            });
        });

        router.get('/game/:hash/scenarios', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            let scenarios = JSON.parse(fs.readFileSync('data/scenarios.json', 'utf8'));
            let matches: {}[] = [];
            scenarios.forEach((scenario) => {
                if (scenario.game === req.params.hash) {
                    matches.push(scenario);
                }
            });
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(matches));
        });

        router.put('/scenario', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('updating scenario');
            if (typeof req.body.hash !== 'undefined') {
                let scenarios = JSON.parse(fs.readFileSync('data/scenarios.json', 'utf8'));
                let k: number;
                let scenario = req.body;
                let found = false;
                for (let i in scenarios) {
                    if (scenarios[i].hash === scenario.hash) {
                        found = true;
                        scenarios[i] = scenario;
                        k = +i;
                    }
                }
                if (!found) {
                    scenarios.push(scenario);
                    k = scenarios.length - 1;
                }
                fs.writeFile('data/scenarios.json', JSON.stringify(scenarios), (err) => {
                    if (err) {
                        res.sendStatus(500);
                        return console.log(err);
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ index: k, game: scenario }));
                });
            }
        });

        router.delete('/scenario/:hash', (req, res) => {
            let auth = req.get('authorization');
            if (typeof auth === 'undefined' || !this.verifyToken(auth)) {
                res.sendStatus(400);
                return;
            }
            console.log('deleting scenario');
            var scenarios = JSON.parse(fs.readFileSync('data/scenarios.json', 'utf8'));
            var newScenarios: any[] = [];
            for (var i in scenarios) {
                if (scenarios[i].hash !== req.params.hash) {
                    newScenarios.push(scenarios[i]);
                }
            }
            fs.writeFile('data/scenarios.json', JSON.stringify(newScenarios), (err) => {
                if (err) {
                    res.sendStatus(500);
                    return console.log(err);
                }
                res.sendStatus(200);
            });
        });

        return router;
    }

    private static verifyToken(token: string) {
        try {
            return require('jsonwebtoken').verify(token, this.secret) ? true : false;
        } catch (e) {
            console.log(e);
        }
        return false;
    }

}