import { Component, EventEmitter, NgZone, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { GUIService } from 'src/app/core/services/gui.service';
import { P2PConnection, P2PDataChannel, P2PManagerService } from 'src/app/core/services/p2p-manager.service';
import { ISignalRConnection, SignallingService } from 'src/app/services/signalling.service';
import { UserService } from 'src/app/services/user.service';
import { FadeSlideInOutAnimation } from 'src/app/shared/animations/fadeSlideInOut.animation';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';

@Component({
  selector: 'app-wallet-receive',
  templateUrl: './wallet-receive.component.html',
  styleUrls: ['./wallet-receive.component.scss'],
  standalone: true,
  imports: [CommonImportsModule],
  animations: [FadeSlideInOutAnimation]
})
export class WalletReceiveComponent implements OnInit, OnDestroy {
  @Output() public goPreviousView = new EventEmitter<void>();
  @Output() public openErrorView = new EventEmitter<string>();

  private readonly signallingService = inject(SignallingService);
  private readonly p2pManagerService = inject(P2PManagerService);
  private readonly guiService = inject(GUIService);
  private readonly userService = inject(UserService);
  private readonly ngZone = inject(NgZone);

  protected isConnecting = false;

  protected bridgeId?: string;
  private bridgeConnection?: ISignalRConnection;
  private bridgeSignalSub?: Subscription;

  private peerConnection?: P2PConnection;
  private transactChannel?: P2PDataChannel;
  protected connectionComplete = false;

  private connectionTimeout?: number;

  public ngOnInit(): void {
    console.group('wallet-transact-receive-logs');
  }

  public async ngOnDestroy() {
    window.clearTimeout(this.connectionTimeout);
    try { await this.bridgeConnection?.Connection.stop(); }
    catch (err) { console.error(err); }
    this.bridgeSignalSub?.unsubscribe();
    this.peerConnection?.Dispose();
    this.transactChannel?.Dispose();
    console.groupEnd();
  }

  protected OnBridgePasteInput() {
    if (this.bridgeId?.length === 36) {
      this.ConnectBridge();
    }
  }

  protected async ConnectBridge() {
    if (!this.bridgeId || this.bridgeId?.length < 36) return;

    this.isConnecting = true;

    this.connectionTimeout = window.setTimeout(() => {
      this.isConnecting = false;
      this.openErrorView.emit('Failed to establish a connection with peer. The session has timed out. Please try again.');
    }, 60000);

    try {
      this.bridgeConnection = await this.signallingService.ConnectToBridge(this.bridgeId);
      this.peerConnection = this.p2pManagerService.CreateConnection();
      this.peerConnection.AwaitDataChannel('transact').then(async channel => {
        await channel.AwaitVerifiedSynAck();
        window.clearTimeout(this.connectionTimeout);
        this.transactChannel = channel;
        this.OnPeerConnected();
      });

      let hasRemoteSdp = false, hasRemoteIce = false;
      this.bridgeSignalSub = this.bridgeConnection.OnReceiveSignal.subscribe({
        next: async ({ signal, data }) => {
          try {
            if (signal === 'send_sdp' && !hasRemoteSdp) { // received peer's sdp
              await this.peerConnection?.SetRemoteSdp(JSON.parse(data));
              hasRemoteSdp = true;
            }

            if (signal === 'send_ice' && !hasRemoteIce) { // received peer's ice
              await this.peerConnection?.SetRemoteIceCandidates(JSON.parse(data));
              hasRemoteIce = true;
            }

            if (hasRemoteSdp && hasRemoteIce) {
              await this.peerConnection?.CreateAnswer();
              await this.peerConnection?.AwaitIceGatheringComplete();

              await this.bridgeConnection?.Connection.invoke('SendSignal', 'send_sdp', JSON.stringify(this.peerConnection?.localSdp));
              await this.bridgeConnection?.Connection.invoke('SendSignal', 'send_ice', JSON.stringify(this.peerConnection?.iceCandidates));

              await this.bridgeConnection?.Connection.stop();
              this.bridgeConnection = undefined;
              this.bridgeSignalSub?.unsubscribe();
            }
          }
          catch (err) {
            window.clearTimeout(this.connectionTimeout);
            this.isConnecting = false;
            console.error(err);
            this.openErrorView.emit('Failed to establish a connection with peer. Please try again.');
          }
        }
      });

      await this.bridgeConnection.Connection.invoke('SendSignal', 'notify_connected', '');
    }
    catch (err) {
      window.clearTimeout(this.connectionTimeout);
      this.isConnecting = false;
      console.error(err);
      this.openErrorView.emit('Failed to establish a connection with peer. Please try again.');
    }
  }

  private OnPeerConnected() {
    this.isConnecting = false;
    this.connectionComplete = true;

    const disconnectSub = this.peerConnection?.onConnectionClose.subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.guiService.CreateToast('Connection closed.', { position: 'top' });
          this.goPreviousView.emit();
          disconnectSub?.unsubscribe();
        });
      }
    });

    this.guiService.CreateToast('Connection successful!', { position: 'top' });
    this.transactChannel?.onMessage.subscribe({
      next: (msg) => {
        this.ngZone.run(() => {
          console.log('got message', msg);

          if (msg.h === 'send_empirian') {
            const { amount } = JSON.parse(msg.d!);
            this.userService.userBalance += amount;
            this.guiService.CreateToast(`Received ${amount} EMPIRIAN!`, { position: 'top' });
          }
        });
      }
    });
  }
}