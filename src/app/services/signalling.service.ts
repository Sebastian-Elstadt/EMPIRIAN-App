import { Injectable, inject } from '@angular/core';
import { EmpirianNetService } from './empirian-net.service';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { LoggingService } from '../core/classes/logging-service.class';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class SignallingService extends LoggingService {
    private readonly empirianNetService = inject(EmpirianNetService);

    private connections: ISignalRConnection[] = [];

    constructor() { super('SIGNAL', 'lime', true); }

    public CreateBridge(userId: string) {
        return new Promise<{ BridgeID: string; }>((resolve, reject) => {
            this.LogInfo('creating bridge...');
            this.empirianNetService.Post<{ BridgeID: string; }>(`signalling/bridge?userId=${userId}`)
                .subscribe({
                    next: res => resolve(res.body!),
                    error: err => reject(err)
                });
        });
    }

    public ConnectToBridge(bridgeId: string) {
        return new Promise<ISignalRConnection>(async (resolve, reject) => {
            try {
                if (this.connections.some(c => c.BridgeID === bridgeId)) {
                    reject('Already connected to bridge.');
                    return;
                }

                this.LogInfo('connecting to bridge:', bridgeId);

                const hubConn = new HubConnectionBuilder()
                    .withUrl(environment.EMPIRIAN_API_URL + 'signalling/exchange?bridgeId=' + bridgeId)
                    .configureLogging(LogLevel.Error)
                    .build();

                hubConn.onclose(() => {
                    this.LogInfo('connection closed:', bridgeId);
                    const connIndex = this.connections.findIndex(c => c.BridgeID === bridgeId);
                    if (connIndex !== -1) {
                        this.connections.splice(connIndex, 1);
                    }
                });

                const onReceiveSignalSubject = new Subject<{ signal: string; data: string; }>();
                hubConn.on('receive_signal', (signal: string, data: string) => {
                    onReceiveSignalSubject.next({ signal, data });
                });

                await hubConn.start();

                const conn: ISignalRConnection = {
                    BridgeID: bridgeId,
                    Connection: hubConn,
                    OnReceiveSignal: onReceiveSignalSubject.asObservable()
                };
                this.connections.push(conn);
                this.LogInfo('connection to bridge established');
                resolve(conn);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    public async KillConnections() {
        this.LogInfo('killing connections...');
        await Promise.all(this.connections.map(c => c.Connection.stop()));
        this.connections = [];
        this.LogInfo('all connections killed.');
    }

    public GetBridgeConnection(bridgeId: string) {
        return this.connections.find(c => c.BridgeID === bridgeId);
    }
}

export interface ISignalRConnection {
    BridgeID: string;
    Connection: HubConnection;
    OnReceiveSignal: Observable<{ signal: string; data: string; }>;
};