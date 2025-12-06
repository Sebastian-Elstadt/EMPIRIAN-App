import { Component, OnInit, inject } from '@angular/core';
import { CryptographyService } from 'src/app/core/services/cryptography.service';
import { SecureStorageService } from 'src/app/core/services/secure-storage.service';
import { FadeSlideInOutAnimation } from 'src/app/shared/animations/fadeSlideInOut.animation';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';

@Component({
  selector: 'wallet-new-wallet',
  templateUrl: './new-wallet.component.html',
  styleUrls: ['./new-wallet.component.scss'],
  standalone: true,
  imports: [CommonImportsModule],
  animations: [FadeSlideInOutAnimation]
})
export class NewWalletComponent implements OnInit {
  private readonly cryptographyService = inject(CryptographyService);
  private readonly secureStorageService = inject(SecureStorageService);

  protected generatingWallet = false;
  protected keyPairGenerated = false;

  public ngOnInit() {
    this.GenerateWallet();
  }

  private async GenerateWallet() {
    this.generatingWallet = true;
    const keyPair = await this.cryptographyService.GenerateAsymmetricKeyPair();

    await this.secureStorageService.Set('wallet:private_key', keyPair.privateKey);
    await this.secureStorageService.Set('wallet:public_key', keyPair.publicKey);

    this.generatingWallet = false;
    this.keyPairGenerated = true;
  }
}