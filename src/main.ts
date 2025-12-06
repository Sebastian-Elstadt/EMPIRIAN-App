// Ionic Angular
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

// App
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { AppConfig } from './app/app.config';

if (environment.production) enableProdMode();
bootstrapApplication(AppComponent, AppConfig);