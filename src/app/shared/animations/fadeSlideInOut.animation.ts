import { trigger, style, animate, transition } from '@angular/animations';

export const FadeSlideInOutAnimation = trigger('fadeSlideInOut', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)', position: 'absolute' }),
        animate('200ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ]),
    transition(':leave', [
        style({ position: 'absolute' }),
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
    ])
]);