import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { ListOperatorComponent } from './list-operator/list-operator.component';
import { OperatorRoutingModule } from './operator-routing.module';
import { AddOperatorComponent } from './add-operator/add-operator.component';
import { ViewOperatorComponent } from './view-operator/view-operator.component';

@NgModule({
  imports: [
    CommonModule,
    OperatorRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule
  ],
  declarations: [ListOperatorComponent, AddOperatorComponent, ViewOperatorComponent]

})

export class OperatorModule { }
