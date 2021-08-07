import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminSettingComponent } from './admin-setting/admin-setting.component';
// import { AddDriverComponent } from './add-driver/add-driver.component';
// import { ViewDriverComponent } from './view-driver/view-driver.component';
import { NgxPermissionsGuard } from 'ngx-permissions';


const routes: Routes = [
  {
    path: 'admin-setting',
    component: AdminSettingComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'SETTING_PERMISSION'
      }
    }
  }
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingRoutingModule { }
