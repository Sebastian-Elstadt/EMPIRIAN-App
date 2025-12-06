import { Component, NgZone, ViewChild, inject } from '@angular/core';
import { IP2PDataChannel, P2PConnection, P2PManagerService } from 'src/app/core/services/p2p-manager.service';
import { SignallingService } from 'src/app/services/signalling.service';
import { UserService } from 'src/app/services/user.service';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';
import { IonModal } from '@ionic/angular/standalone';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonImportsModule]
})
export class ChatPage {
  @ViewChild('mdlConnectionSetup') public mdlConnectionSetup?: IonModal;

  private readonly signallingService = inject(SignallingService);
  public readonly userService = inject(UserService);
  private readonly p2pManagerService = inject(P2PManagerService);
  private readonly ngZone = inject(NgZone);

  private peerConnection?: P2PConnection;
  private channel?: IP2PDataChannel;

  public bridgeId?: string;

  public isConnectingChat = false;

  public chatMessages: IChatMessage[] = [];
  public message = '';

  public async ionViewWillEnter() {
  }

  public IsConnectedToPeer() {
    return this.peerConnection?.isConnected;
  }

  public SendMessage() {
    if (!this.channel) return;

    this.channel.channel.send(this.message);
    this.chatMessages.push({ sender: 'me', text: this.message, timestamp: new Date().toISOString() });
    this.message = '';
  }

  public CloseConnection() {
    this.peerConnection?.Dispose();
    this.mdlConnectionSetup?.dismiss();
  }

  public async StartConnection() {
    this.isConnectingChat = true;
    const didCreateBridge = !this.bridgeId;
    this.bridgeId = this.bridgeId || (await this.signallingService.CreateBridge(this.userService.userId!)).BridgeID;

    const bridgeConnection = await this.signallingService.ConnectToBridge(this.bridgeId!);

    const sendLocalSdp = async () => {
      await bridgeConnection.Connection.invoke('SendSignal', 'send_sdp', JSON.stringify(this.peerConnection?.localSdp));
      await bridgeConnection.Connection.invoke('SendSignal', 'send_ice', JSON.stringify(this.peerConnection?.iceCandidates));
    };

    let hasRemoteSdp = false, hasRemoteIce = false;
    const sub = bridgeConnection.OnReceiveSignal.subscribe({
      next: async ({ signal, data }) => {
        if (signal === 'notify_connected') {
          this.peerConnection = this.p2pManagerService.CreateConnection();
          this.channel = await this.peerConnection?.CreateDataChannel('chat');
          this.channel.onMessage.subscribe({
            next: msg => {
              this.ngZone.run(() => {
                this.chatMessages.push({ sender: 'other', text: msg, timestamp: new Date().toISOString() });
              });
            }
          });

          await this.peerConnection?.CreateOffer();
          await this.peerConnection?.AwaitIceGatheringComplete();
          sendLocalSdp();
          return;
        }

        if (signal === 'send_sdp' && !hasRemoteSdp) {
          this.peerConnection?.SetRemoteSdp(JSON.parse(data));
          hasRemoteSdp = true;
        }

        if (signal === 'send_ice' && !hasRemoteIce) {
          this.peerConnection?.SetRemoteIceCandidates(JSON.parse(data));
          hasRemoteIce = true;
        }

        if (hasRemoteIce && hasRemoteSdp) {
          if (!didCreateBridge) {
            await this.peerConnection?.CreateAnswer();
            await this.peerConnection?.AwaitIceGatheringComplete();
            await sendLocalSdp();
            this.peerConnection?.AwaitDataChannel('chat').then(c => {
              this.channel = c;

              c.onMessage.subscribe({
                next: msg => {
                  this.ngZone.run(() => {
                    this.chatMessages.push({ sender: 'other', text: msg, timestamp: new Date().toISOString() });
                  });
                }
              });
            });

            this.mdlConnectionSetup?.dismiss();
          }

          await bridgeConnection.Connection.stop();
          this.ngZone.run(() => {
            this.isConnectingChat = false;
            sub.unsubscribe();
          });
        }
      }
    });

    if (didCreateBridge) return;

    this.peerConnection = this.p2pManagerService.CreateConnection();
    await bridgeConnection.Connection.invoke('SendSignal', 'notify_connected', '');
  }
}

interface IChatMessage {
  text: string;
  timestamp: string;
  sender: 'other' | 'me';
}