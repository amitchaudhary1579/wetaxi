import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FileValidator } from '../helper/file-input.validator';
import { PassengerHierarchyRoutingModule } from './passenger-hierarchy-routing.module';
import { PassengerHierarchyComponent } from './passenger-hierarchy/passenger-hierarchy.component';
import { ViewPassengerHierarchyComponent } from './view-passenger-hierarchy/view-passenger-hierarchy.component';
import { OnePassengerHierarchyComponent } from './one-passenger-hierarchy/one-passenger-hierarchy.component';

@NgModule({
  imports: [
    CommonModule,
    PassengerHierarchyRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    NgbDatepickerModule
  ],
  declarations: [PassengerHierarchyComponent, ViewPassengerHierarchyComponent, OnePassengerHierarchyComponent],
  providers: [ FileValidator ]

})

export class PassengerHierarchyModule { }
