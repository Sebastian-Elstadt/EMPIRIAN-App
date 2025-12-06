import { Injectable } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Injectable({ providedIn: 'root' })
export class SecureStorageService {
    public Set(key: string, value: any) {
        return SecureStoragePlugin.set({ key, value: JSON.stringify([value]) });
    }

    public Get<T = any>(key: string) {
        return SecureStoragePlugin.get({ key }).then((value) => JSON.parse(value.value)[0] as T);
    }

    public Remove(key: string) {
        return SecureStoragePlugin.remove({ key });
    }
}