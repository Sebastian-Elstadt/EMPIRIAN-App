import { Component, EventEmitter, Output } from '@angular/core';
import { CommonImportsModule } from 'src/app/shared/common-imports.module';

@Component({
  selector: 'wallet-setup-method-select',
  templateUrl: './setup-method-select.component.html',
  styleUrls: ['./setup-method-select.component.scss'],
  standalone: true,
  imports: [CommonImportsModule]
})
export class SetupMethodSelectComponent {
  @Output() public onMethodSelect = new EventEmitter<'new-wallet' | 'recover-wallet'>();
  protected activeButton?: 'new-wallet' | 'recover-wallet';

  protected OnButtonClick(button: 'new-wallet' | 'recover-wallet') {
    this.activeButton = button;
    setTimeout(() => {
      this.onMethodSelect.emit(button);
    }, 200);
  }
}