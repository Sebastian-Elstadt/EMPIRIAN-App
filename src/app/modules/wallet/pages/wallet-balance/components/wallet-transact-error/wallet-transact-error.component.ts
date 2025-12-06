import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';

@Component({
  selector: 'app-wallet-transact-error',
  templateUrl: './wallet-transact-error.component.html',
  styleUrls: ['./wallet-transact-error.component.scss'],
  standalone: true,
  imports: [CommonImportsModule]
})
export class WalletTransactErrorComponent {
  @Output() public goPreviousView = new EventEmitter<void>();
  @Input() public message?: string;
}