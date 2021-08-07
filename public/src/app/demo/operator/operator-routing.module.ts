import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListOperatorComponent } from './list-operator/list-operator.component';
import { AddOperatorComponent } from './add-operator/add-operator.component';
import { ViewOperatorComponent } from './view-operator/view-operator.component';
import { NgxPermissionsGuard } from 'ngx-permissions';


const routes: Routes = [
  {
    path: 'list-operator',
    component: ListOperatorComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'OPERATOR'
      }
    }
  },
  {
    path: 'add-operator',
    component: AddOperatorComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'OPERATOR'
      }
    }
  },
  {
    path: 'view-operator/:operator_id',
    component: ViewOperatorComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: 'OPERATOR'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperatorRoutingModule { }
