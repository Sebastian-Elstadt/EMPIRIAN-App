import { Injectable } from '@angular/core';
import { LoggingService } from '../classes/logging-service.class';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActivityService extends LoggingService {
    constructor() {
        super('ACT', 'lime', true);
        this.Init();
    }

    private Init() {
        this.LogInfo('starting...');
        this.InitializeInactivityMonitor();
    }

    // Inactivity monitor
    private readonly INACTIVITY_TIMEOUT_MS = 60000;
    private inactivityTimeout?: number;
    private readonly _onUserInactiveTimeout = new Subject<void>();
    public readonly onUserInactiveTimeout = this._onUserInactiveTimeout.asObservable();

    private InitializeInactivityMonitor() {
        this.ResetInactivityMonitor();

        ['click', 'mousemove', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, () => this.ResetInactivityMonitor(), true);
        });
    }

    private ResetInactivityMonitor() {
        if (this.inactivityTimeout) {
            window.clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = undefined;
        }

        this.inactivityTimeout = window.setTimeout(() => {
            this.LogInfo('state set to \'inactive\'');
            this._onUserInactiveTimeout.next();
        }, this.INACTIVITY_TIMEOUT_MS);
    }
}