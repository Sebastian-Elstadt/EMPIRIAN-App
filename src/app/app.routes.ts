import { Routes } from '@angular/router';

export const AppRoutes: Routes = [
    { path: 'wallet', loadChildren: () => import('./modules/wallet/wallet.routes').then(r => r.WalletRoutes) },
    { path: '', redirectTo: 'wallet', pathMatch: 'full' },
];