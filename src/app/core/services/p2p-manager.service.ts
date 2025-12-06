import { Injectable } from '@angular/core';
import { LoggingService } from '../classes/logging-service.class';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class P2PManagerService extends LoggingService {
    private connections: P2PConnection[] = [];

    constructor() { super('P2P', 'aqua', true); }

    public CreateConnection() {
        const connection = new P2PConnection();

        connection.onConnectionClose.subscribe({
            next: () => {
                this.connections = this.connections.filter(c => c.id !== connection.id);
            }
        });

        this.connections.push(connection);
        return connection;
    }

    public async KillAllConnections() {
        await Promise.all(this.connections.map(c => c.Dispose()));
        this.connections = [];
    }
}

export class P2PConnection extends LoggingService {
    private peerConnection?: RTCPeerConnection;

    private _iceCandidates: RTCIceCandidate[] = [];
    public get iceCandidates() { return this._iceCandidates; }
    private _onIceGatheringComplete = new Subject<void>();

    private dataChannels: P2PDataChannel[] = [];
    private _onGetRemoteDataChannel = new Subject<P2PDataChannel>();
    public readonly onGetRemoteDataChannel: Observable<P2PDataChannel> = this._onGetRemoteDataChannel.asObservable();

    private _onConnectionClose = new Subject<void>();
    public onConnectionClose: Observable<void> = this._onConnectionClose.asObservable();

    public readonly id: string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    public get isConnected() {
        return this.peerConnection?.connectionState === 'connected';
    }

    public get localSdp() {
        return this.peerConnection?.localDescription;
    }

    constructor() {
        super('P2P-C', 'blue', true);
        this.Init();
    }

    private Init() {
        this.LogInfo('starting...');
        this.peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.elstadt.com:3478' }]
        });

        this.peerConnection.onicecandidate = e => {
            if (!e.candidate) return;
            this._iceCandidates.push(e.candidate);
        };

        this.peerConnection.onicegatheringstatechange = () => {
            if (this.peerConnection?.iceConnectionState === 'new') {
                this.LogInfo('gathering ice...');
            }

            if (this.peerConnection?.iceGatheringState === 'complete') {
                this.LogInfo('ice gathering complete. found ' + this.iceCandidates.length);
                this._onIceGatheringComplete.next();
                this._onIceGatheringComplete.complete();
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            if (this.peerConnection?.iceConnectionState === 'connected') {
                this.LogInfo('connected to peer.');
            }

            if (this.peerConnection?.iceConnectionState === 'disconnected') {
                this.LogError('disconnected from peer.');
                this._onConnectionClose.next();
                this._onConnectionClose.complete();
            }

            if (this.peerConnection?.iceConnectionState === 'failed') {
                this.LogError('connection failed.');
                this._onConnectionClose.next();
                this._onConnectionClose.complete();
            }

            if (this.peerConnection?.iceConnectionState === 'closed') {
                this.LogError('connection closed.');
                this._onConnectionClose.next();
                this._onConnectionClose.complete();
            }

            if (this.peerConnection?.iceConnectionState === 'checking') {
                this.LogInfo('checking connection...');
            }
        };

        this.peerConnection.ondatachannel = e => {
            this.LogInfo('received data channel:', e.channel.label);

            const channel = new P2PDataChannel({
                channelName: e.channel.label,
                peerConnection: this.peerConnection!,
                channel: e.channel,
                onChannelClose: () => {
                    this.dataChannels = this.dataChannels.filter(c => c.channelName !== e.channel.label);
                }
            });

            this.dataChannels.push(channel);
            this._onGetRemoteDataChannel.next(channel);
        };

        this.onConnectionClose.subscribe({
            next: () => this.Dispose()
        });

        this.LogInfo('started.');
    }

    public AwaitIceGatheringComplete() {
        return new Promise<void>(resolve => {
            if (this.peerConnection?.iceGatheringState === 'complete') {
                resolve();
                return;
            }

            this._onIceGatheringComplete.subscribe({
                next: () => {
                    resolve();
                }
            });
        });
    }

    public CreateOffer() {
        return new Promise<RTCSessionDescriptionInit>(async (resolve, reject) => {
            try {
                if (!this.peerConnection) {
                    reject('Peer connection not initialized.');
                    return;
                }

                this.LogInfo('creating offer...');
                const sdp = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(sdp);
                this.LogInfo('offer created.');
                resolve(sdp);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    public CreateAnswer() {
        return new Promise<RTCSessionDescriptionInit>(async (resolve, reject) => {
            if (!this.peerConnection) {
                reject('Peer connection not initialized.');
                return;
            }

            this.LogInfo('creating answer...');
            const sdp = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(sdp);
            this.LogInfo('answer created.');
            resolve(sdp);
        });
    }

    public Dispose() {
        this.LogInfo('disposing...');
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = undefined;
        }

        this.dataChannels.forEach(c => c.Dispose());
        this.dataChannels = [];
        this.LogInfo('disposed all.');
    }

    public SetRemoteSdp(sdp: RTCSessionDescriptionInit) {
        this.LogInfo('setting remote sdp...');
        return this.peerConnection?.setRemoteDescription(sdp);
    }

    public SetRemoteIceCandidates(candidates: RTCIceCandidate[]) {
        this.LogInfo('setting remote ice...');
        return Promise.all(candidates.map(candidate => this.peerConnection?.addIceCandidate(candidate)));
    }

    public CreateDataChannel(channelName: string) {
        return new Promise<P2PDataChannel>((resolve, reject) => {
            if (!this.peerConnection) {
                reject('Peer connection not initialized.');
                return;
            }

            if (this.dataChannels.some(c => c.channelName === channelName)) {
                reject('Channel already exists.');
                return;
            }

            this.LogInfo('creating channel:', channelName);
            const channel = new P2PDataChannel({
                channelName,
                peerConnection: this.peerConnection,
                onChannelClose: () => {
                    this.dataChannels = this.dataChannels.filter(c => c.channelName !== channelName);
                }
            });
            this.dataChannels.push(channel);
            resolve(channel);
        });
    }

    public GetDataChannelByName(channelName: string) {
        return this.dataChannels.find(c => c.channelName === channelName);
    }

    public AwaitDataChannel(channelName: string) {
        return new Promise<P2PDataChannel>(resolve => {
            const channel = this.GetDataChannelByName(channelName);
            if (channel) {
                resolve(channel);
                return;
            }

            const sub = this.onGetRemoteDataChannel.subscribe({
                next: c => {
                    if (c.channelName === channelName) {
                        resolve(c);
                        sub.unsubscribe();
                    }
                }
            });
        });
    }
}

export class P2PDataChannel {
    private readonly origin: 'local' | 'remote' = 'local';
    private readonly channel?: RTCDataChannel;

    private readonly _onMessage = new Subject<IP2PChannelPacket>();
    public readonly onMessage: Observable<IP2PChannelPacket> = this._onMessage.asObservable();

    private readonly onChannelOpen = new Subject<void>();
    private isOpen = false;
    private hasOpened = false;
    private keepAliveInterval?: number;

    private _verifiedSynAck = false;
    private readonly onVerifiedSynAck = new Subject<void>();
    public get verifiedSynAck() {
        return this._verifiedSynAck;
    }

    public get channelName() {
        return this.channel?.label;
    }

    constructor(params: {
        channelName: string;
        peerConnection: RTCPeerConnection;
        channel?: RTCDataChannel;
        onChannelClose?: () => void;
    }) {
        this.origin = params.channel ? 'remote' : 'local';
        this.channel = params.channel ?? params.peerConnection.createDataChannel(params.channelName);

        this.channel.onmessage = e => {
            if (!e.data) return;

            try {
                const parsed = JSON.parse(e.data) as IP2PChannelPacket;

                if(parsed.h === '_keep_alive') return;

                if (parsed.h === '_syn') {
                    this.Send('_ack');
                    this._verifiedSynAck = true;
                    this.onVerifiedSynAck.next();
                    return;
                }

                this._onMessage.next(parsed);
            }
            catch (err) {
                console.error(err);
            }
        };

        if (params.channel) {
            this.isOpen = true;
        }
        else {
            this.channel.onopen = () => {
                this.hasOpened = true;
                this.isOpen = true;
                this.onChannelOpen.next();
            };
        }

        this.channel.onclose = () => {
            window.clearInterval(this.keepAliveInterval);
            this._onMessage.complete();
            this.isOpen = false;
            params.onChannelClose?.();
        };

        this.keepAliveInterval = window.setInterval(() => {
            if (!this.isOpen) return;
            this.Send('_keep_alive');
        }, 60000);
    }

    public Dispose() {
        window.clearInterval(this.keepAliveInterval);
        this.isOpen = false;
        this.channel?.close();
        this._onMessage.complete();
    }

    public Send(header: string, data?: string, packetVersion: number = 1) {
        if (!this.channel || !this.isOpen) throw new Error('Channel not open.');
        this.channel.send(JSON.stringify({ pv: packetVersion, ct: Date.now(), h: header, d: data }));
    }

    public TrySynAck() {
        return new Promise<boolean>(async resolve => {
            if (!this.channel || (!this.isOpen && this.hasOpened)) {
                resolve(false);
                return;
            }

            const sub = this.onMessage.subscribe({
                next: msg => {
                    if (msg.h === '_ack') {
                        window.clearTimeout(synAckTimeout);
                        this._verifiedSynAck = true;
                        this.onVerifiedSynAck.next();
                        resolve(true);
                        sub.unsubscribe();
                    }
                }
            });

            const synAckTimeout = window.setTimeout(() => {
                sub.unsubscribe();
                resolve(false);
            }, 10000);

            this.AwaitChannelOpened().then(() => this.Send('_syn'));
        });
    }

    public AwaitChannelOpened() {
        return new Promise<void>(resolve => {
            if (this.hasOpened) {
                resolve();
                return;
            }

            const sub = this.onChannelOpen.subscribe({
                next: () => {
                    resolve();
                    sub.unsubscribe();
                }
            });
        });
    }

    public AwaitVerifiedSynAck() {
        return new Promise<void>(resolve => {
            if (this.verifiedSynAck) {
                resolve();
                return;
            }

            const sub = this.onVerifiedSynAck.subscribe({
                next: () => {
                    resolve();
                    sub.unsubscribe();
                }
            });
        });
    }
}

export interface IP2PChannelPacket {
    pv: number; // packet version
    ct: number; // created timestamp epoch
    h: string; // header (like the name of the function that needs to be called, a title of the packet)
    d?: string; // data
};