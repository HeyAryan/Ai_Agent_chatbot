import { Routes } from '@angular/router';
import { DualChatComponent } from './dual-chat/dual-chat.component';

export const routes: Routes = [
  { path: '', component: DualChatComponent },
  { path: 'dual-chat', component: DualChatComponent },
  { path: '**', redirectTo: '' }
];
