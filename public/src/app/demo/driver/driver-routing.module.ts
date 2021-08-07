import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListDriverComponent } from './list-driver/list-driver.component';
import { AddDriverComponent } from './add-driver/add-driver.component';
import { ViewDriverComponent } from './view-driver/view-driver.component';
import { NgxPermissionsGuard } from 'ngx-permissions';


const routes: Routes = [
  {
    path: 'list-driver',
    component: ListDriverComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'DRIVER'
      }
    }
  },
  {
    path: 'add-driver',
    component: AddDriverComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'DRIVER'
      }
    }
  },
  {
    path: 'view-driver/:driver_id',
    component: ViewDriverComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'DRIVER'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverRoutingModule { }
