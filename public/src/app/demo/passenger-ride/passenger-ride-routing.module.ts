import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListPassengerRideComponent } from './list-passenger-ride/list-passenger-ride.component';
import { ViewPassengerRideComponent } from './view-passenger-ride/view-passenger-ride.component';
import { SingleViewPassengerRideComponent } from './single-view-passenger-ride/single-view-passenger-ride.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: 'list-passenger-ride',
    component: ListPassengerRideComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'RIDES_HISTORY'
       }
     }
  },
  {
    path: 'view-passenger-ride/:passenger_id',
    component: ViewPassengerRideComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'RIDES_HISTORY'
       }
     }
  },
  {
    path: 'single-view-passenger-ride/:passenger_id',
    component: SingleViewPassengerRideComponent,
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
export class PassengerRideRoutingModule { }
