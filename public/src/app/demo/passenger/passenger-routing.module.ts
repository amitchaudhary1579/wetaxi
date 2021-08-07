import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddPassengerComponent } from './add-passenger/add-passenger.component';
import { ListPassengerComponent } from './list-passenger/list-passenger.component';
import { ViewPassengerComponent } from './view-passenger/view-passenger.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: 'list-passenger',
    component: ListPassengerComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'PASSENGER'
       }
     }
  },
  {
    path: 'add-passenger',
    component: AddPassengerComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'PASSENGER'
       }
     }
  },
  {
    path: 'view-passenger/:passenger_id',
    component: ViewPassengerComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'PASSENGER'
       }
     }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassengerRoutingModule { }
