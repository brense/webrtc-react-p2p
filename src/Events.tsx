import { Observable } from 'rxjs/Observable';
import * as socketIo from 'socket.io-client';
import Auth from './Auth';
import { Subject } from 'rxjs/Subject';
declare var RTCPeerConnection: any;

let server: IoSignalingServer;
let observers: { event: string, observer: any }[] = [];
let eventsList: { event: string, data: any, timestamp: number, peer: string }[] = [];

const Events = {
    excludedEvents: ['channel open', 'iamnew', 'iamready', 'events', 'ready', 'user', 'whois', 'message.new', 'disconnected'],
    receivingEvents: false,
    isNew: true,
    onNewEvent: new Subject(),
    connect(token: string): boolean {
        let port = +window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
        if (process.env.NODE_ENV === 'development') {
            port = 8001;
        }
        server = new IoSignalingServer(window.location.hostname, port, token);

        server.onMessage((message: any, remotePeerId: string) => {
            try {
                message = JSON.parse(message.data);
            } catch (e) {
                //
            }
            for (var k in observers) {
                if (observers[k].event === message.eventType || observers[k].event === 'any') {
                    observers[k].observer.next({ event: message.eventType, data: message.data, from: remotePeerId });
                }
            }
        });

        this.on('whois').subscribe(evt => {
            this.send('user', Auth.authenticatedUser, evt.from);
        });

        this.on('any').subscribe(evt => {
            this.addToEventsList(evt.event, evt.data, evt.timestamp, evt.from);
        });

        /*
        this.on('iamnew').subscribe(evt => {
            if (!this.isNew && !this.receivingEvents) {
                this.send('iamready', {}, evt.from);
            }
        });

        let receiveEventsSubscription = this.on('iamready').subscribe(evt => {
            receiveEventsSubscription.unsubscribe();
            this.receivingEvents = true;
            this.send('events', {}, evt.from);
        });

        this.on('events').subscribe(evt => {
            this.sendEventsTo(evt.from);
        });

        this.on('ready').subscribe(evt => {
            this.receivingEvents = false;
        });
        */

        return true;
    },
    disconnect() {
        this.send('disconnected', {});
        server.disconnect();
    },
    send(eventType: string, data: any, remotePeerId?: string) {
        const timestamp:number = Date.now();
        server.sendMessage(JSON.stringify({ eventType: eventType, data: data, timestamp: timestamp }), remotePeerId);
        this.addToEventsList(eventType, data, timestamp, server.getPeerId());
    },
    on(eventType: string): Observable<any> {
        return new Observable(observer => {
            observers.push({ event: eventType, observer: observer });
        });
    },
    addToEventsList(event: string, data: any, timestamp: number, peer: string) {
        if (this.excludedEvents.indexOf(event) > -1) return;
        const evt = { event: event, data: data, timestamp: timestamp, peer: peer };
        eventsList.push(evt); // TODO: how to manage size of events list...
        this.onNewEvent.next(evt);
    },
    getEventsList() {
        return eventsList;
    },
    sendEventsTo(peer: string) {
        for (let i = 0; i < eventsList.length; i++) {
            let item = eventsList[i];
            setTimeout(() => {
                this.send(item.event, item.data, peer);
            }, 500);
        }
        setTimeout(() => {
            this.send('ready', {}, peer);
        }, 500);
    }
}

class IoSignalingServer {

    public connected = false;

    private localPeerId: string;
    private socket: SocketIOClient.Socket;
    private peers = {};
    private channels = {};
    private onMessageCallback;

    constructor(host: string, port: number, token: string) {
        var url = 'http://' + host + ':' + port;
        this.socket = socketIo(url, {
            query: 'token=' + token,
            forceNew: true
        });

        let init = true;
        this.socket.on('connect', (data: any) => {
            this.connected = true;
            console.log('server connected');
            if (init) {
                init = false;
                this.localPeerId = this.socket.id;
                this.socket.emit('signal', { from: this.localPeerId });
            }
        });

        this.socket.on('signal', (evt: any) => { this.createOffer(evt); });

        this.socket.on('offer', (evt: any) => { this.receiveOffer(evt); });

        this.socket.on('answer', (evt: any) => { this.receiveAnswer(evt); });

        this.socket.on('candidate', (evt: any) => { this.receiveCandidate(evt); });

        this.socket.on('disconnect', (data: any) => {
            this.connected = false;
            console.log('server disconnected');
        });
    }

    public disconnect() {
        this.socket.disconnect();
        for (var k in this.peers) {
            this.peers[k].close();
        }
    }

    public onMessage(callback: any) {
        this.onMessageCallback = callback;
    }

    public sendMessage(message: any, remotePeerId?: string) {
        let channels = this.channels;
        if (typeof remotePeerId !== 'undefined' && typeof this.channels[remotePeerId] !== 'undefined') {
            channels = [this.channels[remotePeerId]];
        }
        for (var peerId in channels) {
            if (channels[peerId].readyState === 'open') {
                channels[peerId].send(message);
            }
        }
    }

    public getPeerId() {
        return this.localPeerId;
    }

    public getSocket() {
        return this.socket;
    }

    private createOffer(data: any) {
        let remotePeerId = data.from;
        let conn = this.getPeerConnection(remotePeerId);
        let channel: any = conn.createDataChannel(remotePeerId, { reliable: false });
        this.setDataChannelListeners(channel, remotePeerId);
        conn.createOffer()
            .then((offer: any) => conn.setLocalDescription(offer))
            .then(() => {
                this.socket.emit('offer', {
                    sdp: conn.localDescription,
                    from: this.localPeerId,
                    to: remotePeerId
                });
            }).catch((e: any) => { });
    }

    private receiveOffer(data: any) {
        let remotePeerId = data.from;
        let conn = this.getPeerConnection(remotePeerId);
        conn.setRemoteDescription(new RTCSessionDescription(data.sdp))
            .then(() => conn.createAnswer())
            .then((answer: any) => conn.setLocalDescription(answer))
            .then(() => {
                this.socket.emit('answer', {
                    sdp: conn.localDescription,
                    from: this.localPeerId,
                    to: remotePeerId
                });
            }).catch((e: any) => { });
    }

    private receiveAnswer(data: any) {
        let remotePeerId = data.from;
        let conn = this.getPeerConnection(remotePeerId);
        conn.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }

    private receiveCandidate(data: any) {
        let remotePeerId = data.from;
        let conn = this.getPeerConnection(remotePeerId);
        if (conn.remoteDescription !== null && data.candidate !== null) {
            conn.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }

    private setDataChannelListeners(channel: any, remotePeerId: string) {
        if (channel.readyState !== 'closed') {
            this.channels[remotePeerId] = channel;
        }
        channel.onmessage = (evt: any) => {
            this.onMessageCallback(evt, remotePeerId);
        };
        channel.onopen = () => {
            server.sendMessage(JSON.stringify({ eventType: "whois", data: {} }), remotePeerId);
        };
        channel.onclose = () => { };
    }

    private getPeerConnection(remotePeerId: string) {
        if (this.peers[remotePeerId]) {
            return this.peers[remotePeerId];
        }
        let conn = new RTCPeerConnection();
        this.peers[remotePeerId] = conn;
        conn.onicecandidate = (event: any) => {
            if (!conn || !event || !event.candidate) return;
            this.socket.emit('candidate', { candidate: event.candidate, from: this.localPeerId, to: remotePeerId });
        };
        conn.ondatachannel = (event: any) => {
            this.setDataChannelListeners(event.channel, remotePeerId);
        };
        conn.oniceconnectionstatechange = (event: any) => {
            if (conn.iceConnectionState === 'disconnected') {
                this.onMessageCallback({ eventType: 'disconnected', data: {} }, remotePeerId);
            }
        }
        return conn;
    }

}

export default Events;