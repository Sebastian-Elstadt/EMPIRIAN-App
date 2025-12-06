import { HttpClient } from '@angular/common/http';
import { Injectable, inject, isDevMode } from '@angular/core';
import { LoggingService } from '../core/classes/logging-service.class';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EmpirianNetService extends LoggingService {
    private readonly httpClient = inject(HttpClient);

    constructor() { super('EMPIRIAN', 'gold', true); }

    public Post<T = any>(route: string, body?: any) {
        return this.httpClient.post<T>(environment.EMPIRIAN_API_URL + route, body, {
            observe: 'response'
        }).pipe(tap(res => this.LogInfo('POST', { route, body, res })));
    }

    public Get<T = any>(route: string) {
        return this.httpClient.get<T>(environment.EMPIRIAN_API_URL + route, {
            observe: 'response'
        }).pipe(tap(res => this.LogInfo('GET', { route, res })));
    }
}