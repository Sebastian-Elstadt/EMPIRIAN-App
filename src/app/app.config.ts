// Ionic Angular
import { ApplicationConfig } from "@angular/core";
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';

// App
import { AppRoutes } from "./app.routes";
import { provideHttpClient } from "@angular/common/http";

export const AppConfig: ApplicationConfig = {
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular({
            swipeBackEnabled: false,
            mode: 'ios',
            innerHTMLTemplatesEnabled: true
        }),
        provideRouter(AppRoutes),
        provideHttpClient(),
        provideAnimations()
    ]
};

// Icons
import { addIcons } from "ionicons";
import { sendOutline, close, fingerPrint, chevronBack } from "ionicons/icons";
addIcons({
    sendOutline,
    close,
    fingerPrint,
    chevronBack
});