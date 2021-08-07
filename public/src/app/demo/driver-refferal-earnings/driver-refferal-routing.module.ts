import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListDriverRefferalEarningsComponent } from './list-driver-refferal-earnings/list-driver-refferal-earnings.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { ViewDriverRefferalEarningsComponent } from './view-driver-refferal-earnings/view-driver-refferal-earnings.component';


const routes: Routes = [
  {
    path: 'list-driver-refferal-earning',
    component: ListDriverRefferalEarningsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'REFFERAL_EARNING'
      }
    }
  },
  {
    path: 'view-driver-refferal-earning/:driver_id',
    component: ViewDriverRefferalEarningsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'REFFERAL_EARNING'
      }
    }
  },
  // {
  //   path: 'single-view-driver-ride/:driver_id',
  //   component: SingleViewDriverRideComponent,
  //   canActivate: [NgxPermissionsGuard],
  //   data: {
  //     permissions: {
  //       only: 'RIDES_HISTORY'
  //     }
  //   }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverRefferalEarningRoutingModule { }
