import { Injectable, inject } from '@angular/core';
import { EmpirianNetService } from './empirian-net.service';
import { KeyStorageService } from '../core/services/key-storage.service';
import { LoggingService } from '../core/classes/logging-service.class';

@Injectable({ providedIn: 'root' })
export class UserService extends LoggingService {
    private readonly PHANTOM_USERID_KEY = 'phantom-userId';

    private readonly empirianNetService = inject(EmpirianNetService);
    private readonly keyStorageService = inject(KeyStorageService);

    private _userId: string | null = null;
    public get userId(): string | null {
        return this._userId;
    }

    // temp
    public userBalance = 10000;

    constructor() {
        super('User', 'darkorange', true);
        this.Init();
    }

    private async Init() {
        this.LogInfo('starting...');
        const userId = await this.keyStorageService.Get<string>(this.PHANTOM_USERID_KEY);
        if (!userId) await this.CreatePhantomUser();
        else {
            this._userId = userId;
        }
    }

    public CreatePhantomUser() {
        return new Promise<void>((resolve, reject) => {
            this.empirianNetService.Post<{ UserID: string; }>('users/phantom')
                .subscribe({
                    next: async res => {
                        this._userId = res.body?.UserID ?? null;
                        await this.keyStorageService.Set(this.PHANTOM_USERID_KEY, res.body?.UserID);
                        resolve();
                    },
                    error: err => reject(err)
                });
        });
    }
}