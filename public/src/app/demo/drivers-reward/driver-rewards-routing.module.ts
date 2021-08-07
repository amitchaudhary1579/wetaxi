import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DriverRewardsComponent } from './driver-rewards/driver-rewards.component';
import { SingleDriverRewardsComponent } from './single-driver-rewards/single-driver-rewards.component';
import { ViewDriverRewardsComponent } from './view-driver-rewards/view-driver-rewards.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { AddRewardComponent } from './add-reward/add-reward.component';


const routes: Routes = [
  {
    path: 'driver-reward',
    component: DriverRewardsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'REWARD_HISTORY'
      }
    }
  },
  {
    path: 'singal-driver-reward/:driver_id',
    component: SingleDriverRewardsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
  {
    path: 'view-driver-reward/:driver_id',
    component: ViewDriverRewardsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'RIDES_HISTORY'
      }
    }
  },
  {
    path: 'add-driver-reward/:driver_id',
    component: AddRewardComponent,
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
export class DriverRewardsRoutingModule { }
