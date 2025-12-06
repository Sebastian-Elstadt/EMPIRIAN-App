import { Injectable } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
    public WriteTextToClipboard(text: string) {
        return Clipboard.write({ string: text });
    }
}