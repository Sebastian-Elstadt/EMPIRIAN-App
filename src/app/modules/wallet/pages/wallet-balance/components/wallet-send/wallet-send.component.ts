import { Component, EventEmitter, NgZone, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClipboardService } from 'src/app/core/services/clipboard.service';
import { GUIService } from 'src/app/core/services/gui.service';
import { P2PConnection, P2PDataChannel, P2PManagerService } from 'src/app/core/services/p2p-manager.service';
import { ISignalRConnection, SignallingService } from 'src/app/services/signalling.service';
import { UserService } from 'src/app/services/user.service';
import { FadeSlideInOutAnimation } from 'src/app/shared/animations/fadeSlideInOut.animation';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';

@Component({
  selector: 'app-wallet-send',
  templateUrl: './wallet-send.component.html',
  styleUrls: ['./wallet-send.component.scss'],
  standalone: true,
  imports: [CommonImportsModule],
  animations: [FadeSlideInOutAnimation]
})
export class WalletSendComponent implements OnInit, OnDestroy {
  @Output() public goPreviousView = new EventEmitter<void>();
  @Output() public openErrorView = new EventEmitter<string>();

  private readonly userService = inject(UserService);
  private readonly signallingService = inject(SignallingService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly p2pManagerService = inject(P2PManagerService);
  private readonly guiService = inject(GUIService);
  private readonly ngZone = inject(NgZone);

  private bridgeId?: string;
  protected get bridgeIdDisplay() {
    return this.bridgeId ? this.bridgeId.replace(/-/g, '') : '';
  }
  private bridgeConnection?: ISignalRConnection;
  private bridgeSignalSub?: Subscription;
  protected isLoadingBridge = false;

  protected isAwaitingPeer = false;
  private peerConnection?: P2PConnection;
  private transactChannel?: P2PDataChannel;
  private onTransactChannelMessage?: Subscription;
  protected connectionComplete = false;

  protected timeoutSecondsLeft = 60;
  private timeoutCountdownInterval?: number;
  private connectionTimeout?: number;

  protected amountToSend?: number;

  public ngOnInit() {
    console.group('wallet-transact-send-logs');
    this.PreparePeerConnection();
  }

  public async ngOnDestroy() {
    this.ClearTimeoutTimers();
    try { await this.bridgeConnection?.Connection.stop(); }
    catch (err) { console.error(err); }
    this.bridgeSignalSub?.unsubscribe();
    this.peerConnection?.Dispose();
    this.onTransactChannelMessage?.unsubscribe();
    this.transactChannel?.Dispose();
    console.groupEnd();
  }

  private async PreparePeerConnection() {
    this.isLoadingBridge = true;

    this.connectionTimeout = window.setTimeout(() => {
      this.isAwaitingPeer = false;
      this.openErrorView.emit('Failed to establish a connection with peer. The session has timed out. Please try again.');
    }, this.timeoutSecondsLeft * 1000);

    this.timeoutCountdownInterval = window.setInterval(() => {
      this.timeoutSecondsLeft--;
      if (this.timeoutSecondsLeft <= 0) {
        window.clearInterval(this.timeoutCountdownInterval);
      }
    }, 1000);

    try {

      // connect to bridge
      this.bridgeId = (await this.signallingService.CreateBridge(this.userService.userId!)).BridgeID;
      this.bridgeConnection = await this.signallingService.ConnectToBridge(this.bridgeId);

      // setup bridge comms to receive p2p data
      let hasRemoteSdp = false, hasRemoteIce = false;
      this.bridgeSignalSub = this.bridgeConnection.OnReceiveSignal.subscribe({
        next: async ({ signal, data }) => {
          try {
            if (signal === 'notify_connected') { // peer has connected
              await this.peerConnection?.AwaitIceGatheringComplete();
              await this.bridgeConnection?.Connection.invoke('SendSignal', 'send_sdp', JSON.stringify(this.peerConnection?.localSdp));
              await this.bridgeConnection?.Connection.invoke('SendSignal', 'send_ice', JSON.stringify(this.peerConnection?.iceCandidates));
              return;
            }

            if (signal === 'send_sdp' && !hasRemoteSdp) { // received peer's sdp
              await this.peerConnection?.SetRemoteSdp(JSON.parse(data));
              hasRemoteSdp = true;
            }

            if (signal === 'send_ice' && !hasRemoteIce) { // received peer's ice
              await this.peerConnection?.SetRemoteIceCandidates(JSON.parse(data));
              hasRemoteIce = true;
            }

            if (hasRemoteSdp && hasRemoteIce) {
              if (!(await this.transactChannel?.TrySynAck())) {
                throw new Error('Failed to establish a connection with peer. Please try again.');
              }

              this.ClearTimeoutTimers();
              this.OnPeerConnected();
              await this.bridgeConnection?.Connection.stop();
              this.bridgeConnection = undefined;
              this.bridgeSignalSub?.unsubscribe();
            }
          }
          catch (err) {
            this.ClearTimeoutTimers();
            console.error(err);
            this.openErrorView.emit('Failed to establish a connection with peer. Please try again.');
          }
        }
      });

      // get p2p ready while we wait for peer
      this.peerConnection = await this.p2pManagerService.CreateConnection();
      this.transactChannel = await this.peerConnection.CreateDataChannel('transact');
      this.onTransactChannelMessage = this.transactChannel.onMessage.subscribe({
        next: msg => {
          console.log('Received message:', msg);
        }
      });

      await this.peerConnection.CreateOffer();

      this.isAwaitingPeer = true;
    }
    catch (err) {
      this.ClearTimeoutTimers();
      console.error(err);
      this.openErrorView.emit('Failed to establish a connection with peer. Please try again.');
    }

    this.isLoadingBridge = false;
  }

  private ClearTimeoutTimers() {
    window.clearTimeout(this.connectionTimeout);
    window.clearInterval(this.timeoutCountdownInterval);
  }

  private async OnPeerConnected() {
    this.isAwaitingPeer = false;
    this.connectionComplete = true;
    this.guiService.CreateToast('Connection successful!', { position: 'top' });

    const disconnectSub = this.peerConnection?.onConnectionClose.subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.guiService.CreateToast('Connection closed.', { position: 'top' });
          this.goPreviousView.emit();
          disconnectSub?.unsubscribe();
        });
      }
    });
  }

  protected async CopyBridgeId() {
    try {
      await this.clipboardService.WriteTextToClipboard(this.bridgeId!);
      this.guiService.CreateToast('Copied to clipboard!', { position: 'top' });
    }
    catch (err) {
      console.error(err);
    }
  }

  protected SendEmpirian() {
    if (!this.amountToSend || this.amountToSend <= 0) return;

    if (this.userService.userBalance < this.amountToSend) {
      this.guiService.CreateAlert({
        header: 'Insufficient Balance',
        message: 'You do not have enough EMPIRIAN to send this amount.'
      });
      return;
    }

    this.userService.userBalance -= this.amountToSend;
    this.transactChannel?.Send('send_empirian', JSON.stringify({ amount: this.amountToSend }));
    this.amountToSend = undefined;

    this.guiService.CreateToast('EMPIRIAN sent!', { position: 'top' });
  }
}