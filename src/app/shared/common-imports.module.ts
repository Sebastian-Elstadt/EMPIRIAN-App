import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSelect, IonInput, IonLabel, IonItem, IonList, IonSelectOption,
    IonFooter, IonIcon, IonModal, IonButtons, IonImg, IonSpinner
} from '@ionic/angular/standalone';
import { ShardStyleButtonComponent } from './components/shard-style-button/shard-style-button.component';

const Shared = [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSelect, IonInput, IonLabel, IonItem, IonList, IonSelectOption,
    IonFooter, IonIcon, IonModal, IonButtons, IonImg, IonSpinner,
    CommonModule, FormsModule,
    ShardStyleButtonComponent
];

@NgModule({
    imports: Shared,
    exports: Shared
})
export class CommonImportsModule { }
