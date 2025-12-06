import { Injectable, inject } from '@angular/core';
import { AlertController, ModalController, ToastController, LoadingController, ModalOptions, AlertOptions, IonicSafeString, ToastOptions, LoadingOptions } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class GUIService {
    private readonly alertController = inject(AlertController);
    private readonly modalController = inject(ModalController);
    private readonly toastController = inject(ToastController);
    private readonly loadingController = inject(LoadingController);

    public async CreateModal(component: any, params?: any, options?: Omit<Omit<ModalOptions, 'component'>, 'componentProps'>) {
        const modal = await this.modalController.create({ component, componentProps: params, ...options });
        await modal.present();
        return modal;
    }

    public GetTopModal() {
        return this.modalController.getTop();
    }

    public CloseAllModals() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let topModal;
                while (!!(topModal = await this.modalController.getTop())) {
                    await topModal.dismiss();
                }

                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }

    public async CreateAlert(options: AlertOptions) {
        options.message = new IonicSafeString(options.message as string);
        options.buttons = options.buttons || ['OK'];

        const alert = await this.alertController.create(options);
        await alert.present();
        return alert;
    }

    public async CreateToast(message: string, options: Omit<ToastOptions, 'message'> = {}) {
        options.duration = options.duration ?? 4000;
        const toast = await this.toastController.create({ message: new IonicSafeString(message), ...options });
        await toast.present();
        return toast;
    }

    public async CreateLoader(message: string, options?: Omit<LoadingOptions, 'message'>) {
        const loading = await this.loadingController.create({ message: new IonicSafeString(message), ...options });
        await loading.present();
        return loading;
    }
}