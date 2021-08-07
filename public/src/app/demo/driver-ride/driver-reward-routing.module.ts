import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListDriverRewardComponent } from './list-driver-reward/list-driver-reward.component';
import { ViewDriverRideComponent } from './view-driver-ride/view-driver-ride.component';
import { SingleViewDriverRideComponent } from './single-view-driver-ride/single-view-driver-ride.component';
import { NgxPermissionsGuard } from 'ngx-permissions';


const routes: Routes = [
  {
    path: 'list-driver-ride',
    component: ListDriverRewardComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
  {
    path: 'view-driver-ride/:driver_id',
    component: ViewDriverRideComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
  {
    path: 'single-view-driver-ride/:driver_id',
    component: SingleViewDriverRideComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverRewardRoutingModule { }
