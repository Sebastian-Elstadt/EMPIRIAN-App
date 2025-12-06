import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: true
})
export class SplashScreenComponent {
  @Output() public onExitSplash = new EventEmitter<void>();

  public OnScreenTap() {
    this.onExitSplash.emit();
  }
}