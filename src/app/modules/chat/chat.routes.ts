import { Routes } from "@angular/router";

export const ChatRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./chat.component').then(m => m.ChatComponent),
        children: [
            { path: '', loadComponent: () => import('./pages/chat/chat.page').then(p => p.ChatPage) }
        ]
    }
]