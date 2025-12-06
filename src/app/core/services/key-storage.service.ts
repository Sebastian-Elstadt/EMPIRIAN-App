import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences'

@Injectable({ providedIn: 'root' })
export class KeyStorageService {
    public Set(key: string, value: any) {
        return Preferences.set({ key, value: JSON.stringify([value]) });
    }

    public async Get<T = any | null>(key: string): Promise<T | null> {
        const value = await Preferences.get({ key });
        if (!value.value) return null;
        return JSON.parse(value.value)[0] as T;
    }

    public Remove(key: string) {
        return Preferences.remove({ key });
    }

    public Clear() {
        return Preferences.clear();
    }
}