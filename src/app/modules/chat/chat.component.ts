import { Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
    selector: 'chat-component',
    standalone: true,
    templateUrl: './chat.component.html',
    imports: [IonRouterOutlet],
})
export class ChatComponent {

}