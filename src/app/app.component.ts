import { Component, NgZone, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

import { ActivityService } from './core/services/activity.service';
import { FadeInOutAnimation } from './shared/animations/fadeInOut.animation';
import { UserService } from './services/user.service';
import { GUIService } from './core/services/gui.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, SplashScreenComponent],
  animations: [FadeInOutAnimation]
})
export class AppComponent {
  private readonly activityService = inject(ActivityService);
  private readonly userService = inject(UserService);
  private readonly ngZone = inject(NgZone);
  private readonly guiService = inject(GUIService);

  public splashScreenVisible = false;

  constructor() {
    this.activityService.onUserInactiveTimeout.subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.splashScreenVisible = true;
          this.guiService.CloseAllModals();
        });
      }
    });
  }
}