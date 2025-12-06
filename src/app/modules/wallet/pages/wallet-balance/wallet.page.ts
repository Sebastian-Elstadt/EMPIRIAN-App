import { Component, ViewChild, inject } from '@angular/core';
import { FadeSlideInOutAnimation } from 'src/app/shared/animations/fadeSlideInOut.animation';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';
import { IonModal } from '@ionic/angular/standalone';
import { WalletSendComponent } from './components/wallet-send/wallet-send.component';
import { WalletTransactErrorComponent } from './components/wallet-transact-error/wallet-transact-error.component';
import { WalletReceiveComponent } from './components/wallet-receive/wallet-receive.component';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
  standalone: true,
  imports: [
    CommonImportsModule,
    WalletSendComponent,
    WalletTransactErrorComponent,
    WalletReceiveComponent
  ],
  animations: [FadeSlideInOutAnimation]
})
export class WalletPage {
  @ViewChild('mdlTransact') public mdlTransact?: IonModal;

  public readonly userService = inject(UserService);

  public errorMessage?: string;

  public transactView: TTransactView = 'method';
  public SetTransactView(view: TTransactView) {
    this.transactView = view;

    if (view === 'method') this.mdlTransact?.setCurrentBreakpoint(0.6);
    else this.mdlTransact?.setCurrentBreakpoint(0.8);

    if (view !== 'error') {
      this.errorMessage = undefined;
    }
  }

  public OnTransactModalDismiss() {
    this.transactView = 'method';
  }

  public OnComponentError(errorMessage: string) {
    this.errorMessage = errorMessage;
    this.SetTransactView('error');
  }
}

type TTransactView = 'method' | 'send' | 'receive' | 'error';