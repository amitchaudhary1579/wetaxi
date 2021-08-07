import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NgxPermissionsGuard } from 'ngx-permissions';
import { NotificationLogsComponent } from './notification-logs.component';

const routes: Routes = [
  {
    path: 'list-notification-log',
    component: NotificationLogsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'NOTIFICATION_LOGS'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationLogsRoutingModule { }
