import { Routes } from "@angular/router";

export const WalletRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./wallet.component').then(c => c.WalletComponent),
        children: [
            { path: '', loadComponent: () => import('./pages/wallet-balance/wallet.page').then(p => p.WalletPage) },
            { path: 'setup', loadComponent: () => import('./pages/wallet-setup/wallet-setup.page').then(p => p.WalletSetupPage) },
        ]
    }
];