import { Component } from '@angular/core';
import { FadeSlideInOutAnimation } from 'src/app/shared/animations/fadeSlideInOut.animation';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';
import { SetupMethodSelectComponent } from './components/setup-method-select/setup-method-select.component';
import { NewWalletComponent } from './components/new-wallet/new-wallet.component';

@Component({
  selector: 'app-wallet-setup',
  templateUrl: './wallet-setup.page.html',
  styleUrls: ['./wallet-setup.page.scss'],
  standalone: true,
  imports: [
    CommonImportsModule,
    SetupMethodSelectComponent,
    NewWalletComponent
  ],
  animations: [FadeSlideInOutAnimation]
})
export class WalletSetupPage {
  public currentView: TSetupView = 'new-wallet';
}

type TSetupView = 'method-select' | 'new-wallet' | 'recover-wallet';