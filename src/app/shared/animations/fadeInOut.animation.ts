import { trigger, style, animate, transition } from '@angular/animations';

export const FadeInOutAnimation = trigger('fadeInOut', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('0.2s ease', style({ opacity: 1 }))
    ]),
    transition(':leave', [
        style({ opacity: 1 }),
        animate('0.2s ease', style({ opacity: 0 }))
    ])
]);