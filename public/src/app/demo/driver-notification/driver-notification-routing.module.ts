import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListDriverNotificationComponent } from './list-driver-notification/list-driver-notification.component';
import { NgxPermissionsGuard } from 'ngx-permissions';


const routes: Routes = [
  {
    path: 'list-driver-notification',
    component: ListDriverNotificationComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'NOTIFY'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverNotificationRoutingModule { }
