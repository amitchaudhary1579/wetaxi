import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PassangerRewardsComponent } from './passanger-rewards/passanger-rewards.component';
import { AddRewardsComponent } from './add-rewards/add-rewards.component';
import { ViewPassangerRewardsComponent } from './view-passanger-rewards/view-passanger-rewards.component';

// import { ViewPassengerRideComponent } from './view-passenger-ride/view-passenger-ride.component';
// import { SingleViewPassengerRideComponent } from './single-view-passenger-ride/single-view-passenger-ride.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: 'passenger-reward',
    component: PassangerRewardsComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'REWARD_HISTORY'
       }
     }
  },
  {
    path: 'add-passanger-rewards/:passenger_id',
    component: AddRewardsComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'REWARD_HISTORY'
       }
     }
  },
  {
    path: 'view-passenger-rewards/:passenger_id',
    component: ViewPassangerRewardsComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'RIDES_HISTORY'
       }
     }
  },
  // {
  //   path: 'single-view-passenger-ride/:passenger_id',
  //   component: SingleViewPassengerRideComponent,
  //   canActivate: [NgxPermissionsGuard],
  //    data: {
  //      permissions: {
  //        only: 'RIDES_HISTORY'
  //      }
  //    }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassangerRewardRoutingModule { }
