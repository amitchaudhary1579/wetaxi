import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PassengerHierarchyComponent } from './passenger-hierarchy/passenger-hierarchy.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { ViewPassengerHierarchyComponent } from './view-passenger-hierarchy/view-passenger-hierarchy.component';
import { OnePassengerHierarchyComponent } from './one-passenger-hierarchy/one-passenger-hierarchy.component';

const routes: Routes = [
  {
    path: 'passenger-hierarchy',
    component: PassengerHierarchyComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'HIERARCHY_HISTORY'
       }
     }
  },
  {
    path: 'view-passenger-hierarchy/:passenger_id',
    component: ViewPassengerHierarchyComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'HIERARCHY_HISTORY'
       }
     }
  },
  {
    path: 'one-passenger-hierarchy/:passenger_id',
    component: OnePassengerHierarchyComponent,
    canActivate: [NgxPermissionsGuard],
     data: {
       permissions: {
         only: 'HIERARCHY_HISTORY'
       }
     }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassengerHierarchyRoutingModule { }
